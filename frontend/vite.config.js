import { defineConfig } from 'vite'
// Trigger restart
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "./", // IMPORTANT
  build: {
    outDir: "dist"
  }
})
