import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('profile saves synchronize existing auth state safely', { timeout: 15000 }, async t => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } });
  const vite = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, watch: null }, appType: 'custom' });
  try {
    const { useAuthStore } = await vite.ssrLoadModule('/src/store/authStore.ts');
    const { api } = await vite.ssrLoadModule('/src/api/client.ts');
    const { setToken, getToken } = await vite.ssrLoadModule('/src/utils/tokenStorage.ts');
    const originalAdapter = api.defaults.adapter;
    const user = { id: 'admin-id', name: 'Original Admin', email: 'admin@example.test', role: 'admin', totalPoints: 42, currentStreak: 2, longestStreak: 3, dailyGoalPages: 20 };
    const profile = { ...user, name: 'Updated Admin', status: 'active', createdAt: '2026-01-01T00:00:00Z' };
    const reset = () => { setToken('existing-session-token'); useAuthStore.setState({ user: { ...user }, initializing: false }); };
    const response = (config, value = profile) => ({ data: { profile: value }, status: 200, statusText: 'OK', headers: {}, config });
    try {
      await t.test('subscribers receive saved name; points, role and token remain unchanged', async () => {
        reset(); const names = [];
        const unsubscribe = useAuthStore.subscribe(state => names.push(state.user?.name));
        api.defaults.adapter = async config => { assert.equal(config.url, '/admin/profile'); assert.equal(config.method, 'patch'); assert.deepEqual(JSON.parse(config.data), { name: 'Updated Admin' }); return response(config); };
        const saved = await useAuthStore.getState().updateAdminName('Updated Admin');
        assert.equal(saved.name, 'Updated Admin'); assert.equal(useAuthStore.getState().user.name, 'Updated Admin'); assert.ok(names.includes('Updated Admin'));
        assert.equal(useAuthStore.getState().user.totalPoints, 42); assert.equal(useAuthStore.getState().user.role, 'admin'); assert.equal(getToken(), 'existing-session-token'); unsubscribe();
      });
      await t.test('failed save keeps previous name and account state', async () => {
        reset(); api.defaults.adapter = async () => { throw new Error('Profile API unavailable'); };
        await assert.rejects(useAuthStore.getState().updateAdminName('Updated Admin'), /unavailable/); assert.deepEqual(useAuthStore.getState().user, user);
      });
      await t.test('late response cannot restore a logged-out administrator', async () => {
        reset(); let complete;
        api.defaults.adapter = config => new Promise(resolve => { complete = () => resolve(response(config)); });
        const pending = useAuthStore.getState().updateAdminName('Updated Admin');
        // Axios schedules request interceptors before invoking its adapter.
        while (!complete) await new Promise(resolve => setImmediate(resolve));
        useAuthStore.getState().logout(); complete(); await pending;
        assert.equal(useAuthStore.getState().user, null); assert.equal(getToken(), null);
      });
      await t.test('late response cannot overwrite a replacement account', async () => {
        reset(); let complete;
        api.defaults.adapter = config => new Promise(resolve => { complete = () => resolve(response(config)); });
        const pending = useAuthStore.getState().updateAdminName('Updated Admin');
        while (!complete) await new Promise(resolve => setImmediate(resolve));
        const replacement = { ...user, id: 'another-admin', name: 'Another Admin' };
        setToken('replacement-session'); useAuthStore.setState({ user: replacement }); complete(); await pending;
        assert.deepEqual(useAuthStore.getState().user, replacement);
      });
      await t.test('reader cannot invoke the administrator update action', async () => {
        reset(); useAuthStore.setState({ user: { ...user, role: 'user' } });
        api.defaults.adapter = () => { throw new Error('Request should not be sent'); };
        await assert.rejects(useAuthStore.getState().updateAdminName('Updated Admin'), /Administrator access required/);
      });
      await t.test('password changes and global sign-out clear the current session only after success', async () => {
        const payload = { currentPassword: 'Original-pass123', newPassword: 'Changed-pass456', confirmPassword: 'Changed-pass456' };
        for (const action of ['changeAdminPassword', 'signOutAdminSessions']) {
          reset();
          api.defaults.adapter = async config => {
            assert.equal(config.method, 'post');
            assert.equal(config.url, action === 'changeAdminPassword' ? '/admin/security/change-password' : '/admin/security/sign-out-all');
            assert.deepEqual(JSON.parse(config.data), action === 'changeAdminPassword' ? payload : { currentPassword: payload.currentPassword });
            return { data: { message: 'Please sign in again.' }, status: 200, statusText: 'OK', headers: {}, config };
          };
          const result = await useAuthStore.getState()[action](action === 'changeAdminPassword' ? payload : payload.currentPassword);
          assert.equal(result.signedOut, true); assert.equal(useAuthStore.getState().user, null); assert.equal(getToken(), null);
        }
      });
      await t.test('failed security request preserves the authenticated session', async () => {
        reset(); api.defaults.adapter = async () => { throw new Error('Current password is incorrect'); };
        await assert.rejects(useAuthStore.getState().signOutAdminSessions('Incorrect'), /incorrect/);
        assert.deepEqual(useAuthStore.getState().user, user); assert.equal(getToken(), 'existing-session-token');
      });
      await t.test('late security success does not sign out a replacement session', async () => {
        reset(); let complete;
        api.defaults.adapter = config => new Promise(resolve => { complete = () => resolve({ data: { message: 'Signed out' }, status: 200, statusText: 'OK', headers: {}, config }); });
        const pending = useAuthStore.getState().signOutAdminSessions('Original-pass123');
        while (!complete) await new Promise(resolve => setImmediate(resolve));
        const replacement = { ...user, id: 'replacement-admin', name: 'Replacement' };
        setToken('replacement-session'); useAuthStore.setState({ user: replacement }); complete();
        assert.equal((await pending).signedOut, false); assert.deepEqual(useAuthStore.getState().user, replacement); assert.equal(getToken(), 'replacement-session');
      });
    } finally { api.defaults.adapter = originalAdapter; }
  } finally {
    await vite.close();
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage); else delete globalThis.localStorage;
  }
});
