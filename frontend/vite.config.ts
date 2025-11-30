import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Pour assurer que Buffer et d'autres globales Node.js sont dispo dans le navigateur
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  // Configuration critique pour Lucid / Cardano
  esbuild: {
    target: "esnext",
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
    exclude: ['lucid-cardano'] // Parfois nécessaire pour éviter le double bundling
  },
})
