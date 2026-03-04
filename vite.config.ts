import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':       ['framer-motion', 'lucide-react'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-charts':   ['recharts'],
          'vendor-forms':    ['react-hook-form', 'zod', '@hookform/resolvers'],
          'vendor-query':    ['@tanstack/react-query', 'zustand'],
          'vendor-pdf':      ['jspdf', 'html2canvas'],
          'vendor-ai':       ['openai'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
