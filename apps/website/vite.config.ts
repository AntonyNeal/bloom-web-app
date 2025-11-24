import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import removeConsole from 'vite-plugin-remove-console';
import { defineConfig } from 'vite';
import { criticalCssInline } from './src/plugins/critical-css-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: ['**/*.tsx', '**/*.ts'],
    }),
    removeConsole(),
    criticalCssInline(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    cors: true,
    port: 5173,
    fs: {
      strict: true,
    },
  },
  // Ensure environment variables are loaded
  envPrefix: 'VITE_',
  // Explicitly define environment files
  envDir: './',
  // Define VITE_ENVIRONMENT at build time to prevent tree-shaking
  define: {
    'import.meta.env.VITE_ENVIRONMENT': JSON.stringify('production'),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React ecosystem - load together to prevent createContext issues
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor';
          }
          // Defer analytics until needed
          if (
            id.includes('react-ga4') ||
            id.includes('applicationinsights-web')
          ) {
            return 'analytics';
          }
          // Defer heavy UI libraries
          if (
            id.includes('@headlessui') ||
            id.includes('@heroicons') ||
            id.includes('lucide-react')
          ) {
            return 'ui';
          }
          // Defer OpenAI (only used in assessment)
          if (id.includes('openai')) {
            return 'openai';
          }
          // Defer react-query
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          // Defer utility libraries (updated for react-helmet-async)
          if (
            id.includes('react-helmet-async') ||
            id.includes('web-vitals') ||
            id.includes('axios')
          ) {
            return 'utils';
          }
          // Split Tailwind and CSS libraries
          if (
            id.includes('@tailwindcss') ||
            id.includes('tailwindcss') ||
            id.includes('postcss')
          ) {
            return 'styles';
          }
          // Split testing libraries (if accidentally included in production)
          if (
            id.includes('@testing-library') ||
            id.includes('vitest') ||
            id.includes('jsdom')
          ) {
            return 'test-libs';
          }
          // Split other node_modules into smaller chunks
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        // Ensure proper file extensions for all chunks
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification with advanced options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Never remove console statements
        drop_debugger: false, // Never remove debugger statements
        pure_funcs: [], // Don't remove any console methods
        passes: 3, // Increased passes for better optimization
        dead_code: true,
        unused: true,
        // toplevel: false - CRITICAL: Don't mangle top-level to preserve window.gtag, window.dataLayer
      },
      mangle: {
        safari10: true,
        // toplevel: false - CRITICAL: Don't mangle top-level to preserve analytics globals
        reserved: ['gtag', 'dataLayer', 'ga', 'fbq'], // Preserve critical tracking function names
      },
      format: {
        comments: false, // Remove comments
      },
    },
    // Optimize CSS
    cssCodeSplit: true,
    // Disable automatic CSS injection - we'll handle it manually for critical CSS
    cssMinify: true,
    // Preload modules for better performance
    modulePreload: {
      polyfill: false,
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable gzip compression
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    // Don't exclude analytics - they need to be available when loaded
    // Just lazy-load them in the app code
  },
  // Enable preview compression
  preview: {
    port: 5174,
    strictPort: true,
  },
  // Performance optimizations
  esbuild: {
    logLevel: 'info',
    target: 'esnext',
    // Never remove console statements
    drop: [],
  },
});
