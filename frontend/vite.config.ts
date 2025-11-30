import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite simple et robuste pour une SPA React moderne.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
})
