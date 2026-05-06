import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/incidents': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/alerts': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/simulate': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
