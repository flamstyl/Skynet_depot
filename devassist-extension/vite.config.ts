import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './manifest.json',
      watchFilePaths: ['src/**/*'],
      browser: 'chrome'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@components': path.resolve(__dirname, './src/shared/components'),
      '@utils': path.resolve(__dirname, './src/shared/utils'),
      '@types': path.resolve(__dirname, './src/shared/types')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      input: {
        // Background
        'background/service-worker': 'src/background/service-worker.ts',

        // Content scripts
        'content/injector': 'src/content/injector.ts',
        'content/integrations/github/main': 'src/content/integrations/github/main.tsx',
        'content/integrations/stackoverflow/enhancer': 'src/content/integrations/stackoverflow/enhancer.tsx',

        // Popup & Sidepanel
        'popup/popup': 'src/popup/popup.html',
        'sidepanel/sidepanel': 'src/sidepanel/sidepanel.html'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
