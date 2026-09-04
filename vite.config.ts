import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_URL || 'http://localhost:4000').trim().replace(/\/+$/, '')

  return {
    plugins: [react()],

    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },

    preview: {
      allowedHosts: true,
    },

    base: process.env.BASE_PATH || '/',
  }
})