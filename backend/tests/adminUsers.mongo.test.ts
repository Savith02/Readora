import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
const run = process.env.RUN_MONGO_INTEGRATION === '1';
// An explicit dbName override below ensures this test never uses the configured application DB.
const uri = process.env.TEST_MONGO_URI ?? process.env.MONGO_URI;
process.env.JWT_SECRET = 'isolated-integration-test-secret-at-least-32-chars';
process.env.NODE_ENV = 'test';

test('real MongoDB user management queries, suspension, audit and concurrent admin protection', { skip: !run, timeout: 90000 }, async () => {
  if (!uri) throw new Error('Configure TEST_MONGO_URI or the existing backend/.env MONGO_URI.');
  const database = `readora_um_test_${randomBytes(8).toString('hex')}`;
  const mongoose = (await import('mongoose')).default;
  const { app } = await import('../src/app.js');
  const { User, ReadingProgress, GameResult, UserTask, Task, PointLog, Badge, AdminAuditLog, AdminMutationLock } = await import('../src/models/index.js');
  const { hashPassword } = await import('../src/utils/password.js');
  const { signToken } = await import('../src/utils/jwt.js');
  const { changeUserAccess } = await import('../src/services/adminUsers.service.js');
  let server: ReturnType<typeof app.listen> | undefined;
  try {
    await mongoose.connect(uri, { dbName: database, serverSelectionTimeoutMS: 8000 });
    assert.equal(mongoose.connection.name, database);
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    await AdminMutationLock.create({ _id: 'user-management', version: 0 });
    const passwordHash = await hashPassword('Integration-Password123');
    const admin = await User.create({ name: 'Test Operator', email: 'operator@example.test', passwordHash, role: 'admin' });
    const reader = await User.create({ name: 'Reader Alpha', email: 'alpha@example.test', passwordHash, totalPoints: 25 });
    const readerB = await User.create({ name: 'Reader Beta', email: 'beta@example.test', passwordHash });
    // Legacy records must remain active even when the physical status/version fields are missing.
    await User.collection.updateOne({ _id: readerB._id }, { $unset: { status: '', sessionVersion: '' } });
    const badge = await Badge.create({ key: 'test-badge', name: 'Test badge', criteria: { metric: 'total_points', threshold: 25 } });
    await User.updateOne({ _id: reader._id }, { $push: { badges: { badgeId: badge._id, earnedAt: new Date() } } });
    const progress = await ReadingProgress.create({ userId: reader._id, bookId: 'test-book', title: 'Stored Book', author: 'Stored Author', progress: 100, finishedAt: new Date() });
    await GameResult.create({ userId: reader._id, gameType: 'quiz', score: 4, maxScore: 5, won: true, pointsAwarded: 10 });
    const task = await Task.create({ key: 'test-task', title: 'Stored Task', type: 'pages', target: 10, rewardPoints: 15 });
    await UserTask.create({ userId: reader._id, taskId: task._id, periodKey: new Date().toISOString().slice(0, 10), completed: true, completedAt: new Date(), progress: 10, rewardClaimed: true });
    await PointLog.create([{ userId: reader._id, points: 10, reason: 'game_win' }, { userId: reader._id, points: 15, reason: 'task_complete' }]);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server!.once('listening', resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
    const adminToken = signToken({ userId: admin.id, role: 'admin' });
    const readerToken = signToken({ userId: reader.id, role: 'user' });
    const call = (path: string, token = adminToken, body?: unknown) => fetch(base + path, { method: body ? 'PATCH' : 'GET', headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const ownProfile: any = await (await call('/admin/profile')).json();
    assert.equal(ownProfile.profile.id, admin.id); assert.equal(ownProfile.profile.email, admin.email);
    assert.equal(ownProfile.profile.createdAt, admin.createdAt.toISOString());
    assert.equal(ownProfile.profile.passwordHash, undefined); assert.equal(ownProfile.profile.sessionVersion, undefined);
    const beforeAdmin = await User.findById(admin._id).select('+passwordHash +sessionVersion').lean();
    const savedProfile = await call(`/admin/profile?userId=${reader.id}`, adminToken, { name: '  Updated Test Operator  ' });
    assert.equal(savedProfile.status, 200);
    assert.equal((await User.findById(admin._id))!.name, 'Updated Test Operator');
    assert.equal((await User.findById(reader._id))!.name, 'Reader Alpha');
    const afterAdmin = await User.findById(admin._id).select('+passwordHash +sessionVersion').lean();
    for (const field of ['role', 'status', 'email', 'passwordHash', 'sessionVersion', 'totalPoints'] as const) assert.deepEqual(afterAdmin![field], beforeAdmin![field]);
    assert.equal((await call('/admin/profile', readerToken)).status, 403);
    assert.equal((await call('/admin/profile', adminToken, { name: 'Unsafe change', role: 'user' })).status, 400);
    assert.equal((await call('/auth/me')).status, 200);
    const list: any = await (await call('/admin/users?role=user&status=active&search=Reader&sort=name_asc')).json();
    assert.equal(list.total, 2); assert.equal(list.users[0].name, 'Reader Alpha'); assert.equal(list.users[1].status, 'active');
    assert.equal(list.users[0].lastReadAt, progress.lastReadAt.toISOString());
    assert.ok(!JSON.stringify(list).includes('passwordHash'));
    for (let i = 0; i < 11; i++) await User.create({ name: `Paging ${String(i).padStart(2, '0')}`, email: `paging${i}@example.test`, passwordHash });
    const page1: any = await (await call('/admin/users?search=Paging&pageSize=10&page=1&sort=name_asc')).json();
    const page2: any = await (await call('/admin/users?search=Paging&pageSize=10&page=2&sort=name_asc')).json();
    assert.equal(page1.users.length, 10); assert.equal(page2.users.length, 1); assert.equal(page1.total, 11);
    assert.ok(!page1.users.some((row: any) => row._id === page2.users[0]._id));
    const profile: any = await (await call(`/admin/users/${reader.id}`)).json();
    assert.equal(profile.reading.started, 1); assert.equal(profile.reading.completed, 1); assert.equal(profile.games.played, 1); assert.equal(profile.games.wins, 1);
    assert.equal(profile.tasks.completed, 1); assert.equal(profile.tasks.rewards, 15); assert.equal(profile.tasks.current[0].title, 'Stored Task');
    assert.equal(profile.points.earned, 25); assert.equal(profile.user.badges[0].badgeId.name, 'Test badge');
    assert.equal(profile.user.passwordHash, undefined); assert.equal(profile.user.sessionVersion, undefined);
    assert.equal((await call('/admin/users', readerToken)).status, 403);
    const beforeProgress = await ReadingProgress.findById(progress._id).lean();
    const beforeLedger = await PointLog.find({ userId: reader._id }).lean();
    assert.equal((await call(`/admin/users/${reader.id}/status`, adminToken, { status: 'suspended', expectedStatus: 'active', reason: 'Integration suspension' })).status, 200);
    assert.equal((await call('/auth/me', readerToken)).status, 401);
    assert.equal((await call(`/admin/users/${reader.id}/status`, adminToken, { status: 'active', expectedStatus: 'suspended', reason: 'Integration reactivation' })).status, 200);
    assert.equal((await call('/auth/me', readerToken)).status, 401);
    assert.deepEqual(await ReadingProgress.findById(progress._id).lean(), beforeProgress);
    assert.deepEqual(await PointLog.find({ userId: reader._id }).lean(), beforeLedger);
    assert.equal((await User.findById(reader._id))!.totalPoints, 25);
    assert.equal(await AdminAuditLog.countDocuments({ targetUserId: reader._id }), 2);
    // Force a real audit failure after the user write. The MongoDB transaction must abort both.
    const originalCreate = AdminAuditLog.create;
    AdminAuditLog.create = (async () => { throw new Error('Injected audit failure'); }) as unknown as typeof AdminAuditLog.create;
    try { await assert.rejects(changeUserAccess(admin.id, readerB.id, { kind: 'status', status: 'suspended', expectedStatus: 'active', reason: 'Audit rollback proof' })); }
    finally { AdminAuditLog.create = originalCreate; }
    assert.notEqual((await User.findById(readerB._id))!.status, 'suspended');
    const secondAdmin = await User.create({ name: 'Second Operator', email: 'second@example.test', role: 'admin', passwordHash });
    const demote = { kind: 'role' as const, role: 'user' as const, expectedRole: 'admin' as const, reason: 'Concurrent demotion test', password: 'Integration-Password123' };
    const result = await Promise.allSettled([changeUserAccess(admin.id, secondAdmin.id, demote), changeUserAccess(secondAdmin.id, admin.id, demote)]);
    assert.equal(result.filter(row => row.status === 'fulfilled').length, 1);
    assert.equal(await User.countDocuments({ role: 'admin', status: { $ne: 'suspended' } }), 1);
    assert.equal(await AdminAuditLog.countDocuments({ action: 'role_change' }), 1);
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === database && /^readora_um_test_[a-f0-9]{16}$/.test(database)) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
