import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'
import { fileURLToPath, URL } from 'node:url'

// Plugin personnalisé pour résoudre le problème avec stream-browserify/web et node:stream/web
const streamBrowserifyFix = () => {
  return {
    name: 'stream-browserify-fix',
    enforce: 'pre' as const, // S'exécuter avant les autres plugins
    resolveId(id: string) {
      // Intercepter les imports de stream-browserify/web
      if (id === 'stream-browserify/web') {
        // Rediriger vers stream-browserify
        return 'stream-browserify';
      }
      // Intercepter node:stream/web AVANT que l'alias pour node:stream ne soit appliqué
      if (id === 'node:stream/web') {
        return fileURLToPath(new URL('./src/stubs/node-stream-web.ts', import.meta.url));
      }
      // Intercepter node:stream également pour éviter les conflits
      if (id === 'node:stream') {
        return fileURLToPath(new URL('./src/stubs/node-stream.ts', import.meta.url));
      }
      return null;
    },
  };
};

// Plugin pour résoudre le problème avec node:net et isIP pour node-fetch
// Utilise un alias pour pointer vers le fichier stub
const nodeNetFix = () => {
  return {
    name: 'node-net-fix',
    enforce: 'pre' as const, // S'exécuter avant nodePolyfills
    resolveId(id: string) {
      // Intercepter node:net et le rediriger vers notre stub
      if (id === 'node:net') {
        // Retourner un chemin résolu vers le stub
        const stubPath = fileURLToPath(new URL('./src/stubs/node-net.ts', import.meta.url));
        return stubPath;
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
      // Désactiver protocolImports pour utiliser nos propres alias
      protocolImports: false,
    }),
  ],
  resolve: {
    alias: {
      // Résoudre le problème avec stream-browserify/web
      'stream-browserify/web': 'stream-browserify',
      // Résoudre les problèmes avec les modules Node.js pour node-fetch et fetch-blob
      // node:stream et node:stream/web sont gérés par le plugin streamBrowserifyFix
      'node:net': fileURLToPath(new URL('./src/stubs/node-net.ts', import.meta.url)),
      'node:util': fileURLToPath(new URL('./src/stubs/node-util.ts', import.meta.url)),
      'node:buffer': fileURLToPath(new URL('./src/stubs/node-buffer.ts', import.meta.url)),
      'node:url': fileURLToPath(new URL('./src/stubs/node-url.ts', import.meta.url)),
      'node:fs': fileURLToPath(new URL('./src/stubs/node-fs.ts', import.meta.url)),
      'node:path': fileURLToPath(new URL('./src/stubs/node-path.ts', import.meta.url)),
      'node:https': fileURLToPath(new URL('./src/stubs/node-https.ts', import.meta.url)),
      'node:zlib': fileURLToPath(new URL('./src/stubs/node-zlib.ts', import.meta.url)),
    },
  },
  server: {
    fs: {
      // Permettre l'accès aux fichiers en dehors de la racine du projet
      allow: ['..'],
    },
    hmr: {
      overlay: true, // Garder l'overlay pour les erreurs
      // Désactiver l'erreur WebSocket dans la console (non critique)
      clientPort: 5173, // Port explicite pour le client WebSocket
    },
    // Configuration du WebSocket pour éviter les erreurs répétées
    ws: {
      // Ne pas afficher d'erreur si la connexion WebSocket échoue (HMR peut continuer sans)
      reconnect: true,
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
