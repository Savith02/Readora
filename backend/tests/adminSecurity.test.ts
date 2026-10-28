import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';

process.env.MONGO_URI = 'mongodb://127.0.0.1/readora_test_unused';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
process.env.NODE_ENV = 'test';

test('admin password changes, session revocation and password reset compatibility', { timeout: 30000 }, async t => {
  const { app } = await import('../src/app.js');
  const { User } = await import('../src/models/index.js');
  const { AdminAuditLog } = await import('../src/models/AdminAuditLog.js');
  const mongoose = (await import('mongoose')).default;
  const originalTransaction = mongoose.connection.transaction;
  const originalAudit = AdminAuditLog.create;
  const logs: Record<string, any>[] = [];
  let failAudit = false;
  AdminAuditLog.create = (async (entries: Record<string, any>[]) => { if (failAudit) throw new Error('Injected audit failure'); logs.push(...entries); }) as unknown as typeof AdminAuditLog.create;
  const { signToken } = await import('../src/utils/jwt.js');
  const { hashPassword } = await import('../src/utils/password.js');
  const id = '507f1f77bcf86cd799439011';
  const account: Record<string, any> = { _id: id, id, name: 'Security Admin', email: 'security@example.test', role: 'admin', status: 'active', totalPoints: 45, passwordHash: await hashPassword('Original-pass123'), sessionVersion: 0 };
  const original = { findOne: User.findOne, findById: User.findById, updateOne: User.updateOne };
  let transactionQueue: Promise<unknown> = Promise.resolve();
  mongoose.connection.transaction = ((callback: (session: unknown) => Promise<unknown>) => {
    const pending = transactionQueue.then(async () => {
      const snapshot = { ...account }; const length = logs.length;
      try { return await callback({}); } catch (error) { for (const key of Object.keys(account)) delete account[key]; Object.assign(account, snapshot); logs.splice(length); throw error; }
    });
    transactionQueue = pending.catch(() => {});
    return pending;
  }) as typeof mongoose.connection.transaction;
  const query = (value: unknown) => ({ select: () => ({ lean: async () => value, then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject) }) });
  const matches = (filter: Record<string, any>): boolean => Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some((item: any) => matches(item));
    if (value && typeof value === 'object') return Object.entries(value).every(([operator, expected]) => operator === '$ne' ? account[key] !== expected : operator === '$exists' ? (key in account) === expected : false);
    return String(account[key]) === String(value);
  });
  User.findById = (() => query({ ...account })) as unknown as typeof User.findById;
  User.findOne = ((filter: Record<string, any>) => query(matches(filter) ? { ...account } : null)) as unknown as typeof User.findOne;
  let writes = 0;
  User.updateOne = (async (filter: Record<string, any>, update: Record<string, any>) => {
    if (!matches(filter)) return { modifiedCount: 0 };
    if (update.$set) Object.assign(account, update.$set);
    for (const [key, value] of Object.entries(update.$inc ?? {})) account[key] = (account[key] ?? 0) + Number(value);
    for (const key of Object.keys(update.$unset ?? {})) delete account[key];
    writes++; return { modifiedCount: 1 };
  }) as unknown as typeof User.updateOne;
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const token = () => signToken({ userId: id, role: account.role, sessionVersion: account.sessionVersion });
  const call = (path: string, auth: string, body?: unknown) => fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const login = (password: string) => call('/auth/login', '', { email: account.email, password });
  const change = { currentPassword: 'Original-pass123', newPassword: 'New-Password456', confirmPassword: 'New-Password456' };
  let current = token();
  try {
    await t.test('admin-only APIs and safe security metadata', async () => {
      account.role = 'user'; for (const path of ['/admin/security', '/admin/security/change-password', '/admin/security/sign-out-all']) assert.equal((await call(path, current, path.endsWith('/security') ? undefined : {})).status, 403); account.role = 'admin';
      assert.equal((await call('/admin/security', '')).status, 401);
      const response = await call('/admin/security', current); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), { security: { passwordChangedAt: null } });
    });
    await t.test('weak, mismatched, reused and incorrect passwords rejected without writes', async () => {
      assert.equal((await call('/admin/security/change-password', current, { ...change, newPassword: 'weak', confirmPassword: 'weak' })).status, 400);
      assert.equal((await call('/admin/security/change-password', current, { ...change, confirmPassword: 'Mismatch456' })).status, 400);
      assert.equal((await call('/admin/security/change-password', current, { ...change, newPassword: change.currentPassword, confirmPassword: change.currentPassword })).status, 400);
      assert.equal((await call('/admin/security/change-password', current, { ...change, currentPassword: 'Incorrect123' })).status, 403);
      assert.equal((await call('/admin/security/change-password', current, { ...change, role: 'admin' })).status, 400);
      assert.equal(writes, 0); assert.equal((await call('/auth/me', current)).status, 200);
    });
    await t.test('successful change hashes password, removes reset links and invalidates old JWT', async () => {
      account.resetTokenHash = 'pending'; account.resetTokenExpiresAt = new Date(Date.now() + 60000);
      const result = await call('/admin/security/change-password', current, change); assert.equal(result.status, 200);
      const body = await result.json(); assert.deepEqual(Object.keys(body as object), ['message']);
      assert.notEqual(account.passwordHash, change.newPassword); assert.equal(account.sessionVersion, 1); assert.equal(account.resetTokenHash, undefined); assert.equal(account.totalPoints, 45);
      assert.equal((await call('/auth/me', current)).status, 401); assert.equal((await login(change.currentPassword)).status, 401);
      const fresh = await login(change.newPassword); assert.equal(fresh.status, 200); current = (await fresh.json() as { token: string }).token;
      assert.equal((await call('/auth/me', current)).status, 200);
      assert.ok((await (await call('/admin/security', current)).json() as any).security.passwordChangedAt);
      assert.equal(logs.length, 1); assert.equal(logs[0].action, 'password_change');
      assert.ok(!JSON.stringify(logs).includes(change.newPassword)); assert.ok(!JSON.stringify(logs).includes(account.passwordHash));
    });
    await t.test('sign out all verifies password and atomically rejects concurrent stale requests', async () => {
      assert.equal((await call('/admin/security/sign-out-all', current, { currentPassword: 'Incorrect123' })).status, 403);
      const responses = await Promise.all([call('/admin/security/sign-out-all', current, { currentPassword: change.newPassword }), call('/admin/security/sign-out-all', current, { currentPassword: change.newPassword })]);
      assert.deepEqual(responses.map(response => response.status).sort(), [200, 401]); assert.equal(account.sessionVersion, 2);
      assert.equal((await call('/auth/me', current)).status, 401);
      current = (await (await login(change.newPassword)).json() as { token: string }).token;
      assert.equal((await call('/auth/me', current)).status, 200);
      assert.equal(logs.length, 2); assert.equal(logs[1].action, 'sessions_revoked');
    });
    await t.test('security audit failure rolls back session invalidation', async () => {
      const version = account.sessionVersion;
      failAudit = true;
      assert.equal((await call('/admin/security/sign-out-all', current, { currentPassword: change.newPassword })).status, 500);
      failAudit = false;
      assert.equal(account.sessionVersion, version); assert.equal(logs.length, 2);
      assert.equal((await call('/auth/me', current)).status, 200);
    });
    await t.test('single-use reset still works, invalidates same-second tokens and preserves suspension', async () => {
      const secret = 'test-only-reset-secret'; account.resetTokenHash = createHash('sha256').update(secret).digest('hex'); account.resetTokenExpiresAt = new Date(Date.now() + 60000);
      const payload = { token: `${id}.${secret}`, password: 'Reset-Password789' };
      assert.equal((await call('/auth/reset-password', '', payload)).status, 200);
      assert.equal((await call('/auth/reset-password', '', payload)).status, 400);
      assert.equal((await call('/auth/me', current)).status, 401);
      assert.equal((await login(change.newPassword)).status, 401); assert.equal((await login(payload.password)).status, 200);
      account.status = 'suspended'; account.resetTokenHash = createHash('sha256').update(secret).digest('hex'); account.resetTokenExpiresAt = new Date(Date.now() + 60000);
      assert.equal((await call('/auth/reset-password', '', { ...payload, password: 'Suspended-Reset123' })).status, 200);
      assert.equal((await login('Suspended-Reset123')).status, 403); assert.equal((await call('/admin/security', token())).status, 401);
    });
    await t.test('sensitive actions are rate limited', async () => {
      account.status = 'active'; current = token();
      assert.equal((await call('/admin/security/sign-out-all', current, { currentPassword: 'Incorrect123' })).status, 429);
    });
  } finally {
    Object.assign(User, original);
    mongoose.connection.transaction = originalTransaction;
    AdminAuditLog.create = originalAudit;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
