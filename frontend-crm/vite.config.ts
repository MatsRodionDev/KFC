import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    hmr: { port: 3001 },
    proxy: {
      '/api/orders': {
        target: 'http://localhost:5046',
        changeOrigin: true,
        timeout: 180000,
        proxyTimeout: 180000,
      },
      '/order-status': {
        target: 'http://localhost:5046',
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: 'http://localhost:5079',
        changeOrigin: true,
      },
    },
  },
})
