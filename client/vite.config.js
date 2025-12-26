import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 2002,
    proxy: {
      '/api': 'http://localhost:1507',
      '/proxy': 'http://localhost:1507',
    }
  },
})
