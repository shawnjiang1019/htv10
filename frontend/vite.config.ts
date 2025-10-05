import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Popup React script (main entry for popup.html)
        popup: resolve(__dirname, 'src/popup-react.tsx'),
        // YouTube content script
        content: resolve(__dirname, 'src/content.tsx'),
        // Article content script
        contentArticle: resolve(__dirname, 'src/articleContent.tsx'),
        // Background script
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'popup') return 'popup.js';
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'contentArticle') return 'articleContent.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});