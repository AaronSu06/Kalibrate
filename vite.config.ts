import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use automatic JSX runtime for smaller bundle
      jsxRuntime: 'automatic',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'mapbox': ['mapbox-gl'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    // Minification settings
    minify: 'esbuild',
    // Source maps only in dev
    sourcemap: false,
    // Smaller chunk warning threshold
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'mapbox-gl'],
  },
})
