import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': ['@headlessui/react', '@heroicons/react', 'lucide-react'],
          'form-handling': ['react-hook-form', '@hookform/resolvers', 'yup'],
          'data-visualization': ['recharts'],
          'utilities': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
})
