import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/readora_test_unused';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
process.env.NODE_ENV = 'test';

test('shared login and admin API enforce the current database role', async () => {
  const { app } = await import('../src/app.js');
  const { User, ReadingProgress, GameResult, UserTask, PointLog } = await import('../src/models/index.js');
  const jwt = await import('jsonwebtoken');
  const { hashPassword } = await import('../src/utils/password.js');
  const passwordHash = await hashPassword('Test-password123');
  let role = 'user';
  const account = () => ({ id: '507f1f77bcf86cd799439011', name: 'Test Reader', email: 'reader@example.test', role, passwordHash });
  const originalFindOne = User.findOne;
  const originalFindById = User.findById;
  const originalExists = User.exists;
  const originalCreate = User.create;
  User.exists = (async () => null) as unknown as typeof User.exists;
  let createdRole: string | undefined;
  User.create = (async (data: { role: string }) => {
    createdRole = data.role;
    return { ...account(), role: data.role };
  }) as unknown as typeof User.create;
  const originals = [User, ReadingProgress, GameResult, UserTask, PointLog].map(model => ({ model, aggregate: model.aggregate, countDocuments: model.countDocuments, find: model.find }));
  // No database connection or records: replace only the model boundaries used by these requests.
  User.findOne = (() => ({ select: async () => account() })) as unknown as typeof User.findOne;
  User.findById = (() => ({ select: () => ({ lean: async () => ({ role }) }) })) as unknown as typeof User.findById;
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const request = (path: string, token?: string) => fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const login = (password: string) => fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'reader@example.test', password }) });
  try {
    const signup = (extra: Record<string, string>) => fetch(base + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test Reader', email: 'reader@example.test', password: 'Test-password123', ...extra }) });
    const publicAdminAttempt = await signup({ accountType: 'admin' });
    assert.equal(publicAdminAttempt.status, 201);
    assert.equal(createdRole, 'user');
    assert.equal((await publicAdminAttempt.json() as { user: { role: string } }).user.role, 'user');
    assert.equal((await signup({ role: 'admin' })).status, 201);
    assert.equal(createdRole, 'user');

    assert.equal((await request('/admin/dashboard')).status, 401);
    assert.equal((await request('/admin/dashboard', 'invalid')).status, 401);
    const expired = jwt.default.sign({ userId: account().id, role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: -1 });
    assert.equal((await request('/admin/dashboard', expired)).status, 401);
    assert.equal((await login('wrong-password')).status, 401);
    const readerLogin = await login('Test-password123');
    assert.equal(readerLogin.status, 200);
    const reader = await readerLogin.json() as { token: string; user: { role: string } };
    assert.equal(reader.user.role, 'user');
    assert.equal((await request('/admin/dashboard', reader.token)).status, 403);
    role = 'admin';
    const adminLogin = await login('Test-password123');
    assert.equal(adminLogin.status, 200);
    const admin = await adminLogin.json() as { token: string; user: { role: string } };
    assert.equal(admin.user.role, 'admin');
    // Invalid range is handled inside the endpoint, proving an admin passed both guards.
    assert.equal((await request('/admin/dashboard?months=99', admin.token)).status, 400);
        for (const { model } of originals) {
      Object.assign(model, {
        aggregate: async () => [],
        countDocuments: async () => 0,
        find: () => ({ sort: () => ({ limit: () => ({ select: () => ({ lean: async () => [] }) }) }) }),
      });
    }
    const dashboard = await request('/admin/dashboard', admin.token);
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.headers.get('cache-control'), 'no-store');
    const body = await dashboard.json() as { stats: { books: null; users: number }; growth: unknown[] };
    assert.equal(body.stats.books, null);
    assert.equal(body.stats.users, 0);
    assert.equal(body.growth.length, 6);
    role = 'user';
    assert.equal((await request('/admin/dashboard', admin.token)).status, 403);
    const { registerSchema } = await import('../src/validators/auth.validators.js');
    assert.equal('accountType' in registerSchema.parse({ name: 'Test Reader', email: 'reader@example.test', password: 'Test-password123', accountType: 'admin' }), false);
    assert.equal('role' in registerSchema.parse({ name: 'Test Reader', email: 'reader@example.test', password: 'Test-password123', role: 'admin' }), false);
  } finally {
    User.findOne = originalFindOne;
    User.findById = originalFindById;
    User.exists = originalExists;
    User.create = originalCreate;
    for (const { model, aggregate, countDocuments, find } of originals) Object.assign(model, { aggregate, countDocuments, find });
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
