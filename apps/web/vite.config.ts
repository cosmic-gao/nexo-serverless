import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@nexo/api': resolve(__dirname, '../../packages/api/src'),
      '@nexo/utils': resolve(__dirname, '../../packages/utils/src'),
    }
  },
  server: {
    headers: {
      // WebContainers 需要这些头来启用 SharedArrayBuffer
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    include: ['@webcontainer/api'],
  },
})
