import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'framer'
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('@tanstack')) return 'query'
            if (id.includes('@radix-ui')) return 'ui'
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
})
