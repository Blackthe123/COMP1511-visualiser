import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// NOTE: 'base' must match your GitHub repository name exactly
export default defineConfig({
  plugins: [react()],
  base: '/COMP1511-visualiser/',
})
