import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// Injects a Content-Security-Policy <meta> tag into index.html at build/serve
// time. This is the XSS-hardening measure chosen instead of httpOnly cookies
// (see project notes): the frontend (GitHub Pages / static host) cannot set
// custom HTTP response headers, so a <meta http-equiv> tag is the only way to
// ship a CSP to it. connect-src/img-src are derived from the real API target
// so this never hardcodes a guessed domain.
function cspPlugin(apiTarget: string, isProd: boolean): Plugin {
  return {
    name: 'inject-csp-meta',
    transformIndexHtml(html) {
      const self = ["'self'"]
      const connectSrc = [...self, apiTarget, 'https://*.supabase.co'].join(' ')
      const imgSrc = [...self, 'data:', 'blob:', apiTarget, 'https://*.supabase.co'].join(' ')
      const directives = [
        "default-src 'self'",
        // No 'unsafe-inline'/'unsafe-eval' for scripts — the main XSS-mitigation line.
        "script-src 'self'",
        // React sets many inline style="" attributes; style-src covers those too,
        // so 'unsafe-inline' is required here. This does not permit script execution.
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
        `img-src ${imgSrc}`,
        `connect-src ${connectSrc}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        ...(isProd ? ['upgrade-insecure-requests'] : []),
      ].join('; ')

      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${directives}" />`
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_URL || 'http://localhost:4000').trim().replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      cspPlugin(apiTarget, mode === 'production'),
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