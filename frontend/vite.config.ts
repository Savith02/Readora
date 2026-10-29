import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // Consume the workspace's TypeScript source in Vite; the backend keeps its CommonJS build.
  resolve: { alias: { '@readora/shared': fileURLToPath(new URL('../packages/shared/src/index.ts', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
