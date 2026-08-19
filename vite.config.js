import { defineConfig } from 'vite';

export default defineConfig({
  base: '/MiniMD/',
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
  },
});
