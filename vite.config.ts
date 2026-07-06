import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { mcpPlugin } from '@lovable.dev/mcp-js/stacks/supabase/vite'

export default defineConfig({
  root: __dirname,
  plugins: [react(), mcpPlugin()],
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
