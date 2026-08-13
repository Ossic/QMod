import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        footprints: 'footprints.html',
      },
    },
  },
});
