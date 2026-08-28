import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    cssTarget: 'safari16',
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['gsap', 'lenis'],
          router: ['react-router-dom'],
        },
      },
    },
  },
})
