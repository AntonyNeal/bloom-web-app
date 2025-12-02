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
    // Force all packages to use the same React instance
    dedupe: ['react', 'react-dom'],
  },
  // Force Vite to pre-bundle these together
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    // Force a single shared instance
    esbuildOptions: {
      // Ensure react is resolved consistently
      plugins: [],
    },
  },
  build: {
    // Enable manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep react and react-dom together in the same chunk
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          // React Router in its own chunk (depends on react-vendor)
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          // UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor';
          }
          // Form handling
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'form-vendor';
          }
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
        // Local dev proxies to dev API (not production!) to avoid accidental data changes
        target: 'https://bloom-functions-dev.azurewebsites.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
