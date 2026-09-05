import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_URL || 'http://localhost:4000').trim().replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      process.env.ANALYZE ? visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }) : undefined,
    ].filter(Boolean),

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