import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  publicDir: false,
  base: '/modules/foundry-module/',
  server: {
    port: 30001,
    open: true,
    proxy: {
      '^(?!/modules/foundry-module/)': 'http://localhost:30000/',
      '/socket.io': {
        target: 'ws://localhost:30000',
        ws: true,
      },
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      name: 'foundry-module',
      entry: 'scripts/module.mjs',
      formats: ['es'],
      fileName: 'module'
    },
    rollupOptions: {
      output: {
        assetFileNames: "styles/[name].[ext]",
      },
    },
  },
});
