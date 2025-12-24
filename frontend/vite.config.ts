import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'

// Plugin personnalisé pour résoudre le problème avec stream-browserify/web
const streamBrowserifyFix = () => {
  return {
    name: 'stream-browserify-fix',
    resolveId(id: string) {
      if (id === 'stream-browserify/web') {
        // Rediriger vers stream-browserify
        return { id: 'stream-browserify', external: false };
      }
      return null;
    },
  };
};

// Configuration Vite optimisée pour la production
export default defineConfig({
  plugins: [
    react(),
    wasm(), // Plugin pour le support WASM (requis pour Aiken et certaines dépendances)
    streamBrowserifyFix(), // Fix pour stream-browserify/web
    // Plugin pour les polyfills Node.js (requis par MeshSDK)
    nodePolyfills({
      // Polyfills globaux nécessaires
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Polyfills pour les modules Node.js spécifiques
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      // Résoudre le problème avec stream-browserify/web
      'stream-browserify/web': 'stream-browserify',
    },
  },
  server: {
    fs: {
      // Permettre l'accès aux fichiers en dehors de la racine du projet
      allow: ['..'],
    },
    hmr: {
      overlay: true, // Garder l'overlay pour les erreurs
    },
  },
  assetsInclude: ['**/*.wasm'], // Inclure les fichiers WASM comme assets
  define: {
    // Polyfill pour 'global' (requis par MeshSDK et certaines dépendances Node.js)
    global: 'globalThis',
  },
  build: {
    target: 'es2022', // Support pour top-level await (requis pour Lucid Cardano)
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'stream-browserify'],
    exclude: ['lucid-cardano', '@aiken-lang/aiken'], // Exclure lucid-cardano et Aiken de l'optimisation (gèrent leurs propres WASM)
    esbuildOptions: {
      target: 'es2022', // Support pour top-level await
      define: {
        global: 'globalThis',
      },
    },
  },
  esbuild: {
    target: 'es2022', // Support pour top-level await
  },
  worker: {
    format: 'es', // Utiliser ESM pour les workers (nécessaire pour WASM)
  },
})
