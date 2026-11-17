import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readFileSync } from 'node:fs'

export default defineConfig({
  plugins: [react(), {
    name: 'include-project-license',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'LICENSE', source: readFileSync(resolve(__dirname, 'LICENSE'), 'utf8') });
    },
  }],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
