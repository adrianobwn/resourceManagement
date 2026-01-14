import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,      // Tentukan port yang diinginkan
    strictPort: true // Jika port 5173 terpakai, Vite akan error dan tidak pindah ke 5174
  }
})