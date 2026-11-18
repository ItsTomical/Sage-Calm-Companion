import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vite treats unknown extensions as JavaScript. The Sage model is a binary
  // glTF file, so it has to be declared an asset or the build tries to parse
  // it as source.
  assetsInclude: ['**/*.glb'],
  // GitHub Pages serves the site from /<repo-name>/, so the deploy workflow
  // sets BASE_PATH. Locally it stays at the root.
  base: process.env.BASE_PATH || '/',
})
