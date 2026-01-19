import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use automatic JSX runtime for smaller bundles
      jsxRuntime: 'automatic',
    }),
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
    dedupe: ['react', 'react-dom', 'framer-motion'],
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
        // More aggressive chunk splitting for better caching
        manualChunks(id) {
          // Keep react and react-dom together in the same chunk
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          // React Router in its own chunk (depends on react-vendor)
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          // UI components - split by usage pattern
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor';
          }
          // Form handling - only loaded on form pages
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'form-vendor';
          }
          // Animation library - defer loading
          if (id.includes('node_modules/framer-motion')) {
            return 'animation-vendor';
          }
          // Charts - only needed for admin/dashboard
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts-vendor';
          }
          // Auth/MSAL - loaded on demand
          if (id.includes('node_modules/@azure/msal')) {
            return 'auth-vendor';
          }
          // Utility libraries
          if (id.includes('node_modules/date-fns')) {
            return 'utils-vendor';
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack')) {
            return 'query-vendor';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Target modern browsers for smaller bundle
    target: 'es2020',

    // Enhanced minification (esbuild is faster and works well)
    minify: 'esbuild',

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Chunk size warnings (alert if chunk > 300KB for better performance)
    chunkSizeWarningLimit: 300,
    
    // Enable source maps for debugging (conditional)
    sourcemap: false,
    
    // Optimize for production
    reportCompressedSize: true,
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
