import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    hmr: { overlay: true, clientPort: 3001 },
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5079',
        changeOrigin: true,
      },
    },
  },
})
