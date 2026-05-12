
  import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
  import tailwindcss from '@tailwindcss/vite';

  export default defineConfig({
  plugins: [angular({ tsconfig: 'tsconfig.app.json' }), tailwindcss()],
    resolve: {
    extensions: ['.js', '.ts', '.json'],
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  });