import { defineConfig } from 'vite';
import path from 'path';
import copy from 'rollup-plugin-copy';

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
      fileName: (format) => 'scripts/module.mjs'
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'styles/module.css';
          return 'styles/[name].[ext]';
        },
      },
      plugins: [
        copy({
          targets: [
            { src: 'module.json', dest: 'dist' },
            { src: 'languages', dest: 'dist' },
            { src: 'packs', dest: 'dist' },
            { src: 'src/templates', dest: 'dist' }
          ],
          hook: 'writeBundle'
        })
      ]
    },
  },
});
