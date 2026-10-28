import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';

process.env.MONGO_URI = 'mongodb://127.0.0.1/readora_test_unused';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
process.env.NODE_ENV = 'test';

test('admin profile API only edits the authenticated administrator name', async t => {
  const { app } = await import('../src/app.js');
  const { User } = await import('../src/models/index.js');
  const { signToken } = await import('../src/utils/jwt.js');
  const actorId = '507f1f77bcf86cd799439011';
  const otherId = '507f1f77bcf86cd799439012';
  let role: 'admin' | 'user' = 'admin';
  let status = 'active';
  let name = 'Original Admin';
  let writes = 0;
  const account = () => ({ id: actorId, _id: actorId, name, email: 'admin@example.test', role, status, createdAt: new Date('2025-05-01T00:00:00Z'), totalPoints: 27, currentStreak: 2, longestStreak: 4, dailyGoalPages: 20, passwordHash: 'private', resetTokenHash: 'private', sessionVersion: 0 });
  const original = { findById: User.findById, findOne: User.findOne, findOneAndUpdate: User.findOneAndUpdate };
  const chain = (value: unknown) => ({ select: () => ({ lean: async () => value, then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject) }) });
  User.findById = (() => chain(account())) as unknown as typeof User.findById;
  User.findOne = ((filter: Record<string, unknown>) => { assert.equal(filter._id, actorId); assert.equal(filter.role, 'admin'); return chain(role === 'admin' && status === 'active' ? account() : null); }) as unknown as typeof User.findOne;
  User.findOneAndUpdate = ((filter: Record<string, unknown>, update: { $set: { name: string } }, options: Record<string, unknown>) => {
    assert.equal(filter._id, actorId); assert.equal(filter.role, 'admin'); assert.deepEqual(filter.status, { $ne: 'suspended' });
    assert.deepEqual(Object.keys(update), ['$set']); assert.deepEqual(Object.keys(update.$set), ['name']); assert.equal(options.runValidators, true); assert.equal(options.returnDocument, 'after');
    name = update.$set.name; writes++;
    return chain(account());
  }) as unknown as typeof User.findOneAndUpdate;
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/admin/profile`;
  const token = signToken({ userId: actorId, role: 'admin' });
  const request = (body?: unknown, url = base, authenticated = true) => fetch(url, { method: body === undefined ? 'GET' : 'PATCH', headers: { ...(authenticated ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  try {
    await t.test('safe profile read and no caching', async () => {
      const response = await request(); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
      const body = await response.json() as { profile: Record<string, unknown> };
      assert.equal(body.profile.name, name); assert.equal(body.profile.email, 'admin@example.test'); assert.equal(body.profile.status, 'active'); assert.equal(body.profile.createdAt, '2025-05-01T00:00:00.000Z');
      for (const key of ['passwordHash', 'resetTokenHash', 'sessionVersion', 'token', 'passwordChangedAt']) assert.equal(key in body.profile, false);
    });
    await t.test('trims and updates only the authenticated account', async () => {
      const response = await request({ name: '  Updated Admin  ' }, `${base}?userId=${otherId}`); assert.equal(response.status, 200);
      const body = await response.json() as { profile: { name: string; totalPoints: number } };
      assert.equal(body.profile.name, 'Updated Admin'); assert.equal(body.profile.totalPoints, 27); assert.equal(name, 'Updated Admin'); assert.equal(writes, 1);
      assert.equal((await request({ name: 'Other', userId: otherId })).status, 400);
    });
    await t.test('invalid names and sensitive fields rejected without writing', async () => {
      for (const value of ['', ' ', 'A', 'A'.repeat(51), null, 123, { $set: { role: 'admin' } }]) assert.equal((await request({ name: value })).status, 400);
      for (const key of ['role', 'status', 'email', 'totalPoints', 'passwordHash', 'password', 'sessionVersion', '_id']) assert.equal((await request({ name: 'Valid Name', [key]: 'forbidden' })).status, 400);
      assert.equal((await request({})).status, 400); assert.equal(writes, 1);
    });
    await t.test('readers, suspended accounts and unauthenticated requests denied', async () => {
      assert.equal((await request(undefined, base, false)).status, 401);
      role = 'user'; assert.equal((await request()).status, 403); assert.equal((await request({ name: 'Reader edit' })).status, 403);
      role = 'admin'; status = 'suspended'; assert.equal((await request()).status, 401); status = 'active';
      assert.equal(writes, 1);
    });
  } finally {
    Object.assign(User, original);
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
