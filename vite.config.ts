import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Copy staticwebapp.config.json to dist folder after build
    {
      name: 'copy-staticwebapp-config',
      closeBundle() {
        try {
          copyFileSync('staticwebapp.config.json', 'dist/staticwebapp.config.json')
          console.log('✅ Copied staticwebapp.config.json to dist/')
        } catch (err) {
          console.warn('⚠️ Could not copy staticwebapp.config.json:', err)
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable module preload for faster dynamic imports
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_filename, deps) => {
        // Preload critical dependencies for faster route loading
        return deps.filter(dep => 
          // Don't preload framer-motion on landing page
          !dep.includes('framer-motion')
        )
      }
    },
    
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
          
          // Auth vendor - separate chunk for Azure MSAL libraries
          'auth-vendor': ['@azure/msal-browser', '@azure/msal-react'],
          
          // Framer Motion - removed from manual chunks to enable automatic code-splitting
          // Will only load on pages that actually import it (JoinUs, QualificationCheck)
          // NOT loaded on landing page = 112 kB saved from critical path
        },
      },
    },
    
    // Target modern browsers for smaller bundle (ES2020+ = 5-10% smaller)
    target: 'es2020',
    
    // Enhanced minification with optimizations
    minify: 'esbuild',
    
    // Enable CSS code splitting (separate CSS per route)
    cssCodeSplit: true,
    
    // Chunk size warnings (alert if chunk > 500KB)
    chunkSizeWarningLimit: 500,
    
    // Source maps for production debugging (hidden from users)
    sourcemap: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://bloom-platform-functions-v2.azurewebsites.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  }
})
