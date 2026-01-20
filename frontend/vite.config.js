import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false // Jika port 5173 terpakai, Vite akan otomatis pindah ke port lain
  }
})