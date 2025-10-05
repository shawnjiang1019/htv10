import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss(),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Main popup
        popup: resolve(__dirname, 'popup.html'),
        // Content script
        content: resolve(__dirname, 'src/content.tsx'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep content script as content.js
          return chunkInfo.name === 'content' ? 'content.js' : '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});