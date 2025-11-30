import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Plugin personnalisé pour intercepter l'import cassé EN MÉMOIRE
const virtualStreamFix = () => {
  return {
    name: 'virtual-stream-fix',
    resolveId(source) {
      // Si on cherche le fichier maudit...
      if (source === 'stream-browserify/web' || source === 'node:stream/web') {
        // ...on retourne un ID virtuel (le \0 dit à Rollup "ce n'est pas un vrai fichier")
        return '\0virtual-stream-web';
      }
    },
    load(id) {
      // Si c'est notre ID virtuel, on retourne du code vide
      if (id === '\0virtual-stream-web') {
        return 'export default {};';
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    virtualStreamFix(), // Notre plugin magique
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
    commonjsOptions: {
      transformMixedEsModules: true, // Aide pour Lucid
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
      // Permet d'utiliser le Top-level await dans les dépendances aussi
      supported: { 
        bigint: true 
      },
    },
    include: ['lucid-cardano']
  }
})
