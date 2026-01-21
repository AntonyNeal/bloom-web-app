import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Copy staticwebapp.config.json to dist folder after build
    {
      name: 'copy-staticwebapp-config',
      closeBundle() {
        try {
          copyFileSync('staticwebapp.config.json', 'dist/staticwebapp.config.json');
          console.log('✅ Copied staticwebapp.config.json to dist/');
        } catch (err) {
          console.warn('⚠️ Could not copy staticwebapp.config.json:', err);
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks (rarely change = better long-term caching)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
          ],
          'form-vendor': ['react-hook-form', 'zod'],

          // Framer Motion - removed from manual chunks to enable automatic code-splitting
          // Will only load on pages that actually import it (JoinUs, QualificationCheck)
          // NOT loaded on landing page = 112 kB saved from critical path
        },
      },
    },

    // Target modern browsers for smaller bundle
    target: 'es2020',

    // Enhanced minification (esbuild is faster and works well)
    minify: 'esbuild',

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Chunk size warnings (alert if chunk > 500KB)
    chunkSizeWarningLimit: 500,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://bloom-platform-functions-dev.azurewebsites.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
