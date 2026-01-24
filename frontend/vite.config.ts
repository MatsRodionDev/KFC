import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/catalog': {
        target: 'http://localhost:5079',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catalog/, '/api')
      },
      '/api/orders': {
        target: 'http://localhost:5046',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/orders/, '/api')
      },
      '/api/checkout': {
        target: 'http://localhost:5114',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/checkout/, '/api/checkout')
      },
      '/api/geo': {
        target: 'http://localhost:5172',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geo/, '/api/geo')
      },
      '/api/chatclient': {
        target: 'http://localhost:5088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chatclient/, '/api')
      }
    }
  }
})

