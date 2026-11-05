import { defineConfig } from 'vite';
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { host: '0.0.0.0', proxy: { '/api': 'http://127.0.0.1:5000' } },
});
