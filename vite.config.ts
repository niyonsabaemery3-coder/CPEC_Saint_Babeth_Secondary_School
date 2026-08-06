import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Deployed to GitHub Pages at https://<user>.github.io/<repo>/, so built
  // assets need that sub-path prefix. The GitHub Actions workflow in
  // .github/workflows/deploy.yml sets BASE_PATH to "/<repo-name>/"
  // automatically on every deploy — nothing to edit here.
  // Local dev, Vercel/Netlify, a custom domain, or a github.io *user* page
  // (e.g. yourname.github.io) all just fall back to "/".
  base: process.env.BASE_PATH || '/',
})
