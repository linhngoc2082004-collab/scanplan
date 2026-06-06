import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API requests to the backend during development
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/deadlines': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/reminder-settings': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/syllabus': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})