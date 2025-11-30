import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // On garde ce plugin car il gère très bien Buffer et Global qui sont critiques
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // CORRECTIF CRUCIAL : Redirection explicite du module manquant
      'stream-browserify/web': 'stream-browserify',
      // Sécurité supplémentaire : on mappe aussi le module standard stream
      stream: 'stream-browserify',
    },
  },
  esbuild: {
    // Lucid utilise du code très récent
    target: "es2022",
  },
  build: {
    target: "es2022",
    outDir: "dist",
    commonjsOptions: {
      // Permet à Vite de digérer les modules mixtes (CJS/ESM) comme ceux de Cardano
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
    // On force l'inclusion pour éviter que Vite ne les ignore au pré-bundling
    include: ['lucid-cardano', 'stream-browserify']
  }
})
