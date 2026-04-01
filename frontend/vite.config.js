import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  define: {
    // Makes VITE_API_URL available as import.meta.env.VITE_API_URL
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})
