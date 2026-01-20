import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,      // Tetap di 5173
    strictPort: true // Error jika terpakai, jangan auto-switch
  }
})