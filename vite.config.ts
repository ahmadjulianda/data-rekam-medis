import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Upload isi folder dist/ ke public_html di cPanel (atau subfolder).
// Jika dipasang di subfolder, ubah base menjadi '/nama-folder/' dan VITE_BASE_PATH
// di .env.local menjadi nilai yang sama (lihat README).
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@tanstack')) return 'query'
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
        },
      },
    },
  },
})
