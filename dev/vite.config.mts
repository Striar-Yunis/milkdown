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
        toolbar: path.resolve(__dirname, 'toolbar-local-test.ts'),
        crepeReact: path.resolve(__dirname, 'crepe-react-test.html'),
      },
    },
  },
  server: {
    open: '/toolbar-local-test.html',
  },
  resolve: {
    alias: {
      '@milkdown/crepe': path.resolve(__dirname, '../packages/crepe/src'),
      '@milkdown/utils': path.resolve(__dirname, '../packages/utils/src'),
      '@milkdown/kit': path.resolve(__dirname, '../packages/kit/src'),
    },
  },
})
