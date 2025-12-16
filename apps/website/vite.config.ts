import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import removeConsole from 'vite-plugin-remove-console';
import { defineConfig } from 'vite';
import { criticalCssInline } from './src/plugins/critical-css-plugin';

// Force rebuild: 2025-12-03 - Added VITE_AVAILABILITY_FUNCTION_URL

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
          // Stripe - separate chunk, lazy loaded only when needed for payment
          if (
            id.includes('@stripe/react-stripe-js') ||
            id.includes('@stripe/stripe-js')
          ) {
            return 'stripe';
          }
          // Core React ecosystem - load together to prevent createContext issues
          // Include ALL packages that depend on React to avoid createContext errors
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-helmet-async') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/prop-types/') ||
            id.includes('node_modules/@headlessui') ||
            id.includes('node_modules/@heroicons') ||
            id.includes('node_modules/lucide-react')
          ) {
            return 'vendor';
          }
          // Defer analytics - BUT ApplicationInsights vendor-misc
          if (
            id.includes('react-ga4')
          ) {
            return 'analytics';
          }
          // OpenAI (only used in assessment)
          if (id.includes('openai')) {
            return 'openai';
          }
          // React-query
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          // Utility libraries
          if (
            id.includes('web-vitals') ||
            id.includes('axios')
          ) {
            return 'utils';
          }
          // Tailwind and CSS libraries
          if (
            id.includes('@tailwindcss') ||
            id.includes('tailwindcss') ||
            id.includes('postcss')
          ) {
            return 'styles';
          }
          // Testing libraries (if accidentally included in production)
          if (
            id.includes('@testing-library') ||
            id.includes('vitest') ||
            id.includes('jsdom')
          ) {
            return 'test-libs';
          }
          // All other node_modules go into vendor to ensure proper loading order
          if (id.includes('node_modules')) {
            return 'vendor';
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
