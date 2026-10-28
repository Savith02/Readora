import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';

process.env.MONGO_URI = 'mongodb://127.0.0.1/readora_test_unused';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
process.env.NODE_ENV = 'test';

test('public platform settings, protected versioned writes and atomic audit', async t => {
  const { app } = await import('../src/app.js');
  const { PlatformSettings, AdminAuditLog, User } = await import('../src/models/index.js');
  const { DEFAULT_PLATFORM_SETTINGS } = await import('@readora/shared');
  const { signToken } = await import('../src/utils/jwt.js');
  const mongoose = (await import('mongoose')).default;
  const id = '507f1f77bcf86cd799439011';
  const actor = { role: 'admin', status: 'active', sessionVersion: 0 };
  let row: Record<string, any> | null = null;
  const logs: Record<string, any>[] = [];
  let failAudit = false;
  const originals = { find: PlatformSettings.findById, write: PlatformSettings.findOneAndUpdate, user: User.findById, audit: AdminAuditLog.create, transaction: mongoose.connection.transaction };
  const query = (value: unknown) => { const chain = { select: () => chain, session: () => chain, lean: async () => value }; return chain; };
  User.findById = (() => query({ ...actor })) as unknown as typeof User.findById;
  PlatformSettings.findById = (() => query(row && { ...row })) as unknown as typeof PlatformSettings.findById;
  PlatformSettings.findOneAndUpdate = ((filter: any, update: any, options: any) => {
    assert.equal(filter._id, 'platform'); assert.ok(options.session); assert.equal(options.runValidators, true);
    if (row && row.revision !== filter.revision) return query(null);
    row = { ...row, ...update.$set, revision: (row?.revision ?? 0) + 1, _id: 'platform', updatedAt: new Date() };
    return query(row);
  }) as unknown as typeof PlatformSettings.findOneAndUpdate;
  AdminAuditLog.create = (async (entries: Record<string, any>[]) => { if (failAudit) throw new Error('Injected platform audit failure'); logs.push(...entries); }) as unknown as typeof AdminAuditLog.create;
  let queue: Promise<unknown> = Promise.resolve();
  mongoose.connection.transaction = ((callback: (session: unknown) => Promise<unknown>) => {
    const pending = queue.then(async () => {
      const snapshot = row && { ...row }; const count = logs.length;
      try { return await callback({}); } catch (error) { row = snapshot; logs.splice(count); throw error; }
    }); queue = pending.catch(() => {}); return pending;
  }) as typeof mongoose.connection.transaction;
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const token = signToken({ userId: id, role: 'admin' });
  const call = (path: string, body?: unknown, auth: string | null = token, method = body === undefined ? 'GET' : 'PATCH') => fetch(base + path, { method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const settings = { ...DEFAULT_PLATFORM_SETTINGS, displayName: 'Readora Library', supportEmail: 'support@example.test', announcementEnabled: true, announcementText: 'Scheduled maintenance on Sunday.' };
  try {
    await t.test('safe defaults without writes; public allowlist and admin-only access', async () => {
      assert.deepEqual(await (await call('/platform-settings', undefined, null)).json(), { settings: DEFAULT_PLATFORM_SETTINGS });
      assert.deepEqual(await (await call('/admin/platform-settings')).json(), { settings: DEFAULT_PLATFORM_SETTINGS, revision: 0 });
      assert.equal(row, null); assert.equal(logs.length, 0);
      assert.equal((await call('/admin/platform-settings', undefined, null)).status, 401);
      actor.role = 'user'; assert.equal((await call('/admin/platform-settings')).status, 403);
      assert.equal((await call('/admin/platform-settings', { revision: 0, settings })).status, 403);
      actor.role = 'admin'; actor.status = 'suspended'; assert.equal((await call('/admin/platform-settings')).status, 401); actor.status = 'active';
      for (const method of ['POST', 'PATCH', 'DELETE']) assert.equal((await call('/platform-settings', {}, null, method)).status, 404);
    });
    await t.test('strict input rejects arbitrary keys, secrets, unsafe assets and unsupported settings', async () => {
      for (const body of [
        { revision: -1, settings }, { revision: '0', settings }, { revision: 0, settings, role: 'admin' },
        ...[{ jwtSecret: 'no' }, { dailyGoalPages: 50 }, { theme: 'unknown' }, { logoStyle: 'javascript:alert(1)' }, { logoUrl: 'https://remote.test/logo.svg' }, { supportEmail: 'not-an-email' }, { displayName: ' ' }, { description: 'a'.repeat(501) }, { displayName: '\u0000Bad' }, { announcementText: '' }].map(value => ({ revision: 0, settings: { ...settings, ...value } })),
      ]) assert.equal((await call('/admin/platform-settings', body)).status, 400);
      assert.equal(row, null); assert.equal(logs.length, 0);
    });
    await t.test('publish persists the singleton and audits once; public response omits metadata', async () => {
      const response = await call('/admin/platform-settings', { revision: 0, settings }); assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), { settings, revision: 1 });
      assert.equal(logs.length, 1); assert.equal(logs[0].action, 'platform_settings_update'); assert.equal(logs[0].administratorId, id);
      assert.deepEqual(JSON.parse(logs[0].previous), DEFAULT_PLATFORM_SETTINGS); assert.deepEqual(JSON.parse(logs[0].next), settings);
      assert.deepEqual(await (await call('/platform-settings', undefined, null)).json(), { settings });
      assert.equal((await call('/admin/platform-settings', { revision: 0, settings: { ...settings, displayName: 'Stale edit' } })).status, 409);
      assert.equal((await call('/admin/platform-settings', { revision: 1, settings })).status, 200); assert.equal(logs.length, 1);
    });
    await t.test('competing saves reject stale edits; audit failures roll back changes', async () => {
      const responses = await Promise.all(['First change', 'Second change'].map(displayName => call('/admin/platform-settings', { revision: 1, settings: { ...settings, displayName } })));
      assert.deepEqual(responses.map(value => value.status).sort(), [200, 409]); assert.equal(logs.length, 2);
      const before = await (await call('/admin/platform-settings')).json();
      failAudit = true;
      assert.equal((await call('/admin/platform-settings', { revision: 2, settings })).status, 500);
      failAudit = false;
      assert.deepEqual(await (await call('/admin/platform-settings')).json(), before); assert.equal(logs.length, 2);
    });
    await t.test('writes are rate limited', async () => {
      let status = 0;
      for (let attempt = 0; attempt < 31 && status !== 429; attempt++) status = (await call('/admin/platform-settings', {})).status;
      assert.equal(status, 429);
    });
  } finally {
    PlatformSettings.findById = originals.find; PlatformSettings.findOneAndUpdate = originals.write; User.findById = originals.user; AdminAuditLog.create = originals.audit; mongoose.connection.transaction = originals.transaction;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
