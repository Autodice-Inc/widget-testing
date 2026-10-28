import { defineConfig, loadEnv } from 'vite'

// Locally the page reaches the API through this dev server (/v1 → the Nest API), so the page and
// the API share an origin and the login cookies need no CORS entry. API_PROXY_TARGET points it at
// another API. A build talks to a deployed API and widget instead, so it needs both URLs (README).
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())

  if (command === 'build') {
    const missing = ['VITE_API_BASE', 'VITE_WIDGET_LOADER'].filter((key) => !env[key])
    if (missing.length) throw new Error(`Set ${missing.join(' and ')} for the build (see README.md).`)
  }

  return {
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/v1': process.env.API_PROXY_TARGET || 'http://localhost:3000' },
    },
  }
})
