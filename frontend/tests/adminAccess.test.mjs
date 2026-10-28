import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('administrator directory, audit history and existing role workflow share the authenticated API client', async () => {
  const vite = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' });
  try {
    const { api } = await vite.ssrLoadModule('/src/api/client.ts');
    const { fetchUsers, setUserRole } = await vite.ssrLoadModule('/src/api/adminUsers.api.ts');
    const { fetchAdminAudit } = await vite.ssrLoadModule('/src/api/adminAudit.api.ts');
    const original = api.defaults.adapter;
    const calls = [];
    api.defaults.adapter = async config => { calls.push(config); return { data: { total: 0, logs: [], users: [], page: 2, pageSize: 10, totalPages: 0 }, status: 200, statusText: 'OK', headers: {}, config }; };
    try {
      const controller = new AbortController();
      await fetchUsers(new URLSearchParams({ role: 'admin', status: 'active', search: 'Operator', page: '2', pageSize: '10' }), controller.signal);
      assert.equal(calls[0].url, '/admin/users'); assert.equal(calls[0].params.get('role'), 'admin'); assert.equal(calls[0].params.get('page'), '2'); assert.equal(calls[0].signal, controller.signal);
      const history = await fetchAdminAudit(new URLSearchParams({ action: 'role_change', from: '2026-01-01', to: '2026-12-31', page: '2', pageSize: '10' }), controller.signal);
      assert.equal(history.total, 0); assert.equal(calls[1].url, '/admin/audit-logs'); assert.equal(calls[1].params.get('action'), 'role_change'); assert.equal(calls[1].signal, controller.signal);
      await setUserRole({ _id: 'target', role: 'admin' }, 'user', 'Reviewed access', 'Test-password123');
      assert.equal(calls[2].url, '/admin/users/target/role'); assert.equal(calls[2].method, 'patch');
      assert.deepEqual(JSON.parse(calls[2].data), { role: 'user', expectedRole: 'admin', reason: 'Reviewed access', password: 'Test-password123' });
      api.defaults.adapter = async () => { throw new Error('Audit unavailable'); };
      await assert.rejects(fetchAdminAudit(new URLSearchParams()), /Audit unavailable/);
    } finally { api.defaults.adapter = original; }
  } finally { await vite.close(); }
});
