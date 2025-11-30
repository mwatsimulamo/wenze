import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  esbuild: {
    target: "esnext",
  },
  build: {
    target: "esnext",
    outDir: "dist",
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
    // On force l'optimisation pour convertir le CommonJS de Lucid en ESM propre
    include: ['lucid-cardano'] 
  },
  resolve: {
    alias: {
      // Redirection vers notre fichier local vide pour éviter l'erreur ENOENT
      'stream-browserify/web': path.resolve(__dirname, 'src/shims/stream-web.ts'),
      'node:stream/web': path.resolve(__dirname, 'src/shims/stream-web.ts'),
    },
  },
})
