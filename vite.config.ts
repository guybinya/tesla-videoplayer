import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist-app',
  },
  worker: {
    format: 'es',
  },
});
