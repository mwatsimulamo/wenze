import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite optimisée pour la production
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022', // Support pour top-level await (requis pour Lucid Cardano)
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
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
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    exclude: ['lucid-cardano'], // Exclure lucid-cardano de l'optimisation (gère ses propres WASM)
    esbuildOptions: {
      target: 'es2022', // Support pour top-level await
    },
  },
  esbuild: {
    target: 'es2022', // Support pour top-level await
  },
})
