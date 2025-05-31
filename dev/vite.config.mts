import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        'non-react': path.resolve(__dirname, 'non-react/index.html'),
        'react': path.resolve(__dirname, 'react/index.html'),
        'legacy-toolbar': path.resolve(__dirname, 'legacy/toolbar-local-test.html'),
        'legacy-react': path.resolve(__dirname, 'legacy/crepe-react-test.html'),
      },
    },
  },
  server: {
    open: '/non-react/index.html',
  },
  resolve: {
    alias: {
      '@milkdown/crepe': path.resolve(__dirname, '../packages/crepe/src'),
      '@milkdown/utils': path.resolve(__dirname, '../packages/utils/src'),
      '@milkdown/kit': path.resolve(__dirname, '../packages/kit/src'),
      '@milkdown/integrations/react': path.resolve(__dirname, '../packages/integrations/react/src'),
    },
  },
})
