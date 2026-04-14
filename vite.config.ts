import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 8080,
    allowedHosts: true,
  },
  resolve: {
    alias: [
      {
        find: '@/integrations/supabase/client',
        replacement: path.resolve(__dirname, './src/lib/supabase.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
    ],
  },
})
