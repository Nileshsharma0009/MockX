import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // VITE USES POSTCSS.CONFIG.JS AUTOMATICALLY. 
    // No need to add extra PostCSS plugins here, as they are defined in that file.
  ],
})