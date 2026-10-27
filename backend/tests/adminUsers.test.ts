import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { ClientSession } from 'mongoose';

process.env.MONGO_URI = 'mongodb://127.0.0.1/readora_test_unused';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
process.env.NODE_ENV = 'test';

test('user management HTTP, access policy and atomic mutation workflow (isolated model adapter)', async t => {
  const { app } = await import('../src/app.js');
  const mongoose = (await import('mongoose')).default;
  const { User, ReadingProgress, GameResult, UserTask, PointLog, AdminAuditLog, AdminMutationLock } = await import('../src/models/index.js');
  const { hashPassword } = await import('../src/utils/password.js');
  const { signToken } = await import('../src/utils/jwt.js');
  const { checkAccessPolicy, userFilter } = await import('../src/services/adminUsers.service.js');
  const { usersQuerySchema } = await import('../src/validators/adminUsers.validators.js');
  const { currentPeriods } = await import('../src/routes/adminUsers.routes.js');
  const passwordHash = await hashPassword('Test-password123');
  const adminId = '507f1f77bcf86cd799439011';
  const readerId = '507f1f77bcf86cd799439012';
  const otherId = '507f1f77bcf86cd799439013';
  const records = new Map<string, Record<string, any>>([
    [adminId, { _id: adminId, id: adminId, name: 'Operator', email: 'operator@example.test', role: 'admin', status: 'active', sessionVersion: 0, passwordHash, totalPoints: 0, createdAt: new Date('2026-01-02'), badges: [] }],
    [readerId, { _id: readerId, id: readerId, name: 'Reader Alpha', email: 'alpha@example.test', role: 'user', sessionVersion: 0, passwordHash, totalPoints: 40, createdAt: new Date('2026-02-02'), badges: [] }],
    [otherId, { _id: otherId, id: otherId, name: 'Reader Beta', email: 'beta@example.test', role: 'user', status: 'active', sessionVersion: 0, passwordHash, totalPoints: 30, createdAt: new Date('2026-03-02'), badges: [] }],
  ]);
  const audit: Record<string, any>[] = [];
  let failAudit = false;
  const originals: { object: any; key: string; value: any }[] = [];
  const replace = (object: any, key: string, value: any) => { originals.push({ object, key, value: object[key] }); object[key] = value; };
  const query = (value: any) => {
    const chain: any = { select: () => chain, session: () => chain, populate: () => chain, sort: () => chain, skip: () => chain, limit: () => chain, lean: () => Promise.resolve(value), then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject) };
    return chain;
  };
  const matches = (row: Record<string, any>, filter: Record<string, any>): boolean => Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some((item: any) => matches(row, item));
    if (value instanceof RegExp) return value.test(row[key] ?? '');
    if (value && typeof value === 'object') return Object.entries(value).every(([operator, expected]: [string, any]) => operator === '$ne' ? row[key] !== expected : operator === '$gte' ? row[key] >= expected : operator === '$lte' ? row[key] <= expected : operator === '$gt' ? row[key] > expected : operator === '$lt' ? row[key] < expected : false);
    return String(row[key]) === String(value);
  });
  replace(User, 'findById', (id: any) => query(records.get(String(id))));
  replace(User, 'findOne', (filter: any) => query([...records.values()].find(row => matches(row, filter))));
  replace(User, 'exists', (filter: any) => query([...records.values()].some(row => matches(row, filter)) ? { _id: readerId } : null));
  replace(User, 'countDocuments', (filter: any) => query([...records.values()].filter(row => matches(row, filter)).length));
  replace(User, 'aggregate', async (pipeline: any[]) => {
    let rows = [...records.values()].filter(row => matches(row, pipeline[0].$match));
    const sort = pipeline.find(stage => stage.$sort)?.$sort;
    if (sort) rows.sort((a, b) => { for (const [key, direction] of Object.entries(sort)) { if (a[key] < b[key]) return -Number(direction); if (a[key] > b[key]) return Number(direction); } return 0; });
    const skip = pipeline.find(stage => stage.$skip !== undefined)?.$skip ?? 0;
    const limit = pipeline.find(stage => stage.$limit)?.$limit ?? 10;
    assert.ok(limit <= 50);
    return rows.slice(skip, skip + limit).map(({ _id, name, email, role, status, createdAt }) => ({ _id, name, email, role, status: status ?? 'active', createdAt, lastReadAt: null }));
  });
  replace(User, 'updateOne', async (filter: any, update: any) => {
    const row = records.get(String(filter._id))!;
    // Only account access and session fields may be changed by this module.
    assert.ok(Object.keys(update.$set).every(key => ['role', 'status', 'suspensionReason', 'statusChangedAt'].includes(key)));
    Object.assign(row, update.$set);
    row.sessionVersion = (row.sessionVersion ?? 0) + (update.$inc?.sessionVersion ?? 0);
    return { modifiedCount: 1 };
  });
  replace(AdminMutationLock, 'updateOne', async () => ({ modifiedCount: 1 }));
  replace(AdminAuditLog, 'create', async (logs: any[]) => { if (failAudit) throw new Error('Simulated audit write failure'); audit.push(...logs.map((log, i) => ({ ...log, _id: String(audit.length + i), createdAt: new Date() }))); });
  replace(AdminAuditLog, 'countDocuments', (filter: any) => query(audit.filter(row => matches(row, filter)).length));
  replace(AdminAuditLog, 'find', (filter: any) => query(audit.filter(row => matches(row, filter))));
  replace(ReadingProgress, 'aggregate', async (pipeline: any[]) => pipeline.some(stage => stage.$facet) ? [{ summary: [{ started: 3, completed: 1, lastReadAt: new Date('2026-03-03') }], recent: [{ _id: 'progress', title: 'Stored title', progress: 50 }] }] : [{ count: 2 }]);
  replace(GameResult, 'aggregate', async () => [{ summary: [{ played: 2, wins: 1 }], recent: [] }]);
  replace(UserTask, 'aggregate', async () => [{ summary: [{ completed: 1 }], current: [], recent: [] }]);
  replace(PointLog, 'aggregate', async () => [{ earned: 45, taskRewards: 10 }]);
  replace(mongoose.connection, 'transaction', async (callback: (session: ClientSession) => unknown) => {
    const snapshot = structuredClone([...records]);
    const auditLength = audit.length;
    try { return await callback({} as ClientSession); }
    catch (error) { records.clear(); for (const [id, row] of snapshot) records.set(id, row); audit.splice(auditLength); throw error; }
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const token = (id: string) => signToken({ userId: id, role: records.get(id)!.role, sessionVersion: records.get(id)!.sessionVersion });
  const adminToken = token(adminId);
  const oldReaderToken = token(readerId);
  const request = (path: string, auth = adminToken, body?: unknown) => fetch(base + path, { method: body ? 'PATCH' : 'GET', headers: { Authorization: `Bearer ${auth}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const login = () => fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'alpha@example.test', password: 'Test-password123' }) });
  try {
    await t.test('reader denied across list, profile, stats, audit, role and status APIs', async () => {
      for (const path of ['/admin/users', '/admin/users/stats', `/admin/users/${readerId}`, `/admin/users/${readerId}/audit-logs`]) assert.equal((await request(path, oldReaderToken)).status, 403);
      for (const path of ['role', 'status']) assert.equal((await request(`/admin/users/${readerId}/${path}`, oldReaderToken, {})).status, 403);
    });
    await t.test('validated literal search, filters, deterministic ordering and pagination', async () => {
      const response = await request('/admin/users?search=Reader&role=user&status=active&sort=name_desc&pageSize=10');
      assert.equal(response.status, 200);
      const body: any = await response.json();
      assert.equal(body.total, 2); assert.equal(body.users[0]._id, otherId); assert.equal(body.users[1].status, 'active');
      assert.equal(body.users[0].passwordHash, undefined);
      assert.equal((await request('/admin/users?pageSize=9999')).status, 400);
      assert.equal((await request('/admin/users?role=owner')).status, 400);
      assert.equal((await request('/admin/users?from=2026-03-01&to=2026-01-01')).status, 400);
      const dated: any = await (await request('/admin/users?from=2026-02-01&to=2026-02-28')).json(); assert.equal(dated.total, 1);
      const next: any = await (await request('/admin/users?page=2')).json(); assert.equal(next.page, 2); assert.equal(next.users.length, 0);
      const literal = userFilter(usersQuerySchema.parse({ search: '.*[a]$' })); assert.equal((literal.$or as any[])[0].name.test('ordinary name'), false);
      assert.equal((await request('/admin/users/not-an-id')).status, 400);
      assert.equal((await request('/admin/users/507f1f77bcf86cd799439099')).status, 404);
    });
    await t.test('profile reuses stored summaries and never serializes authentication credentials', async () => {
      const result: any = await (await request(`/admin/users/${readerId}`)).json();
      assert.equal(result.reading.started, 3); assert.equal(result.reading.completed, 1); assert.equal(result.games.played, 2); assert.equal(result.tasks.rewards, 10); assert.equal(result.points.balance, 40);
      assert.equal(result.user.passwordHash, undefined); assert.equal(result.user.sessionVersion, undefined);
      assert.equal(result.points.readerRank, 1);
      assert.deepEqual(currentPeriods(new Date('2027-01-01T12:00:00Z')), ['2027-01-01', '2026-W53']);
    });
    await t.test('suspension blocks login and sessions; reactivation requires fresh login; activity untouched', async () => {
      assert.equal((await request(`/admin/users/${readerId}/status`, adminToken, { status: 'suspended', expectedStatus: 'active', reason: 'Reported misuse' })).status, 200);
      assert.equal(records.get(readerId)!.totalPoints, 40); assert.equal(audit[0].action, 'suspend');
      assert.equal((await login()).status, 403);
      assert.equal((await request('/auth/me', oldReaderToken)).status, 401);
      const stats: any = await (await request('/admin/users/stats')).json(); assert.equal(stats.total, 2); assert.equal(stats.suspended, 1);
      assert.equal((await request(`/admin/users/${readerId}/status`, adminToken, { status: 'active', expectedStatus: 'suspended', reason: 'Review complete' })).status, 200);
      assert.equal((await request('/auth/me', oldReaderToken)).status, 401);
      const fresh = await login(); assert.equal(fresh.status, 200);
      const body: any = await fresh.json(); assert.equal((await request('/auth/me', body.token)).status, 200);
      assert.equal(records.get(readerId)!.totalPoints, 40);
    });
    await t.test('role changes need admin password, reason and current state; self and last-admin protected', async () => {
      const change = { role: 'admin', expectedRole: 'user', reason: 'Approved operator', password: 'wrong' };
      assert.equal((await request(`/admin/users/${readerId}/role`, adminToken, change)).status, 403);
      assert.equal((await request(`/admin/users/${readerId}/role`, adminToken, { ...change, password: 'Test-password123' })).status, 200);
      assert.equal(records.get(readerId)!.role, 'admin'); assert.equal(audit.at(-1)!.action, 'role_change');
      assert.equal((await request(`/admin/users/${adminId}/role`, adminToken, { role: 'user', expectedRole: 'admin', reason: 'Self demotion', password: 'Test-password123' })).status, 409);
      assert.equal((await request(`/admin/users/${readerId}/status`, adminToken, { status: 'suspended', expectedStatus: 'active', reason: 'Cannot suspend admin' })).status, 409);
      assert.throws(() => checkAccessPolicy(adminId, { id: readerId, role: 'admin', status: 'active' }, { kind: 'role', role: 'user', expectedRole: 'admin', reason: 'Test', password: 'test' }, 1), /last active administrator/);
      assert.equal((await request(`/admin/users/${readerId}/role`, adminToken, { role: 'owner', expectedRole: 'admin', reason: 'Invalid role', password: 'Test-password123' })).status, 400);
      const logs: any = await (await request(`/admin/users/${readerId}/audit-logs`)).json(); assert.equal(logs.total, 3); assert.ok(logs.logs.every((log: any) => !('password' in log)));
    });
    await t.test('audit failure rolls back account update; stale changes rejected', async () => {
      failAudit = true;
      assert.equal((await request(`/admin/users/${otherId}/status`, adminToken, { status: 'suspended', expectedStatus: 'active', reason: 'Must roll back' })).status, 500);
      failAudit = false;
      assert.equal(records.get(otherId)!.status, 'active'); assert.equal(records.get(otherId)!.sessionVersion, 0);
      assert.equal((await request(`/admin/users/${otherId}/status`, adminToken, { status: 'active', expectedStatus: 'suspended', reason: 'Stale request' })).status, 409);
    });
  } finally {
    for (const original of originals.reverse()) original.object[original.key] = original.value;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
