import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

test('public branding integration, resilient settings state and protected save contract', async t => {
  const vite = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, watch: null, hmr: false }, ssr: { resolve: { externalConditions: ['node', 'module-sync'] } }, appType: 'custom' });
  try {
    const { api } = await vite.ssrLoadModule('/src/api/client.ts');
    const { usePlatformSettings: store } = await vite.ssrLoadModule('/src/store/platformSettingsStore.ts');
    const { fetchPlatformSettings, savePlatformSettings } = await vite.ssrLoadModule('/src/api/platformSettings.api.ts');
    const { DEFAULT_PLATFORM_SETTINGS } = await import('@readora/shared');
    const original = api.defaults.adapter;
    const publicSettings = { ...DEFAULT_PLATFORM_SETTINGS, displayName: 'Library <script>', description: 'Reading & discovery', supportEmail: 'help@example.test', logoStyle: 'app-icon', announcementEnabled: true, announcementText: 'Service announcement' };
    const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
    try {
      await t.test('API failures preserve defaults and the last successfully loaded public values', async () => {
        api.defaults.adapter = async () => { throw new Error('Offline'); };
        await store.getState().load(); assert.deepEqual(store.getState().settings, DEFAULT_PLATFORM_SETTINGS);
        api.defaults.adapter = async config => { assert.equal(config.url, '/platform-settings'); return response(config, { settings: publicSettings }); };
        await store.getState().load(); assert.deepEqual(store.getState().settings, publicSettings);
        api.defaults.adapter = async () => { throw new Error('Offline'); };
        await store.getState().load(); assert.deepEqual(store.getState().settings, publicSettings);
      });
      await t.test('a late public response cannot overwrite a just-published admin update', async () => {
        let complete;
        api.defaults.adapter = config => new Promise(resolve => { complete = () => resolve(response(config, { settings: DEFAULT_PLATFORM_SETTINGS })); });
        const pending = store.getState().load();
        while (!complete) await new Promise(resolve => setImmediate(resolve));
        store.getState().apply(publicSettings); complete(); await pending;
        assert.deepEqual(store.getState().settings, publicSettings);
      });
      await t.test('settings read and publish reuse the API client and revision contract', async () => {
        const snapshot = { settings: publicSettings, revision: 7 };
        api.defaults.adapter = async config => {
          assert.equal(config.url, '/admin/platform-settings');
          if (config.method === 'patch') assert.deepEqual(JSON.parse(config.data), snapshot);
          else assert.equal(config.method, 'get');
          return response(config, snapshot);
        };
        assert.deepEqual(await fetchPlatformSettings(), snapshot); assert.deepEqual(await savePlatformSettings(snapshot), snapshot);
      });
      await t.test('shared logo and footer display configured branding as escaped text and bundled assets', async () => {
        const { default: Logo } = await vite.ssrLoadModule('/src/components/layout/Logo.tsx');
        const { default: Footer } = await vite.ssrLoadModule('/src/components/layout/Footer.tsx');
        // React's server renderer reads the initial external-store snapshot, rather than
        // subscribing to updates as the browser does. Supply the loaded fixture snapshot.
        const initial = store.getInitialState();
        const originalSettings = initial.settings;
        initial.settings = publicSettings;
        try {
        const markup = renderToStaticMarkup(createElement(MemoryRouter, null, createElement('div', null, createElement(Logo), createElement(Footer))));
        assert.ok(markup.includes('Library &lt;script&gt;')); assert.ok(!markup.includes('<script>'));
        assert.ok(markup.includes('/icons/icon-192.png')); assert.ok(markup.includes('Reading &amp; discovery')); assert.ok(markup.includes('mailto:help@example.test'));
        store.getState().apply({ ...DEFAULT_PLATFORM_SETTINGS });
        initial.settings = { ...DEFAULT_PLATFORM_SETTINGS };
        const defaults = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Footer)));
        assert.ok(defaults.includes('Readora')); assert.ok(!defaults.includes('mailto:')); assert.ok(!defaults.includes('/icons/icon-192.png'));
        } finally { initial.settings = originalSettings; }
      });
      await t.test('settings render five linked tab panels; the existing admin route rejects readers', async () => {
        const { default: Settings } = await vite.ssrLoadModule('/src/pages/admin/AdminSettings.tsx');
        const { default: AdminRoute } = await vite.ssrLoadModule('/src/routes/AdminRoute.tsx');
        const { useAuthStore } = await vite.ssrLoadModule('/src/store/authStore.ts');
        const markup = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Settings)));
        assert.equal((markup.match(/role="tab"/g) || []).length, 5);
        assert.equal((markup.match(/role="tabpanel"/g) || []).length, 5);
        for (const match of markup.matchAll(/aria-controls="([^"]+)"/g)) assert.ok(markup.includes(`id="${match[1]}"`));
        for (const label of ['My profile', 'Password &amp; security', 'Administrator access', 'Audit logs', 'Platform settings']) assert.ok(markup.includes(label));
        const initial = useAuthStore.getInitialState(); const originalUser = initial.user;
        try {
          for (const role of ['user', 'admin']) {
            initial.user = { id: 'test-account', role, name: 'Test Account' };
            const tree = createElement(MemoryRouter, { initialEntries: ['/admin'] }, createElement(Routes, null,
              createElement(Route, { path: '/admin', element: createElement(AdminRoute) }, createElement(Route, { index: true, element: createElement('span', null, 'Protected admin content') })),
            ));
            const result = renderToStaticMarkup(tree);
            assert.equal(result.includes('Protected admin content'), role === 'admin');
          }
        } finally { initial.user = originalUser; }
      });
    } finally { api.defaults.adapter = original; }
  } finally { await vite.close(); }
});
