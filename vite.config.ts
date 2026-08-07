import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  preview: {
    allowedHosts: ['saith-babeth-tss.onrender.com'],
  },

  base: process.env.BASE_PATH || '/',
})