import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        zasady: resolve(import.meta.dirname, 'zasady.html'),
      },
    },
  },
});
