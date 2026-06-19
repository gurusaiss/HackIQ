import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // loadEnv with '' prefix loads ALL env vars — including non-VITE_ ones
  // Non-VITE_ vars are NEVER sent to the browser bundle; they exist only here in Node
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Groq proxy — key stays server-side in dev
        '/api/groq': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api\/groq/, ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              const key = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY
              if (key) proxyReq.setHeader('Authorization', `Bearer ${key}`)
            })
          },
        },
        // Anthropic proxy — key + beta header stay server-side in dev
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api\/anthropic/, ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              const key = env.ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY
              if (key) {
                proxyReq.setHeader('x-api-key', key)
                proxyReq.setHeader('anthropic-version', '2023-06-01')
                proxyReq.setHeader('anthropic-beta', 'web-search-2025-03-05')
              }
            })
          },
        },
      },
    },
  }
})
