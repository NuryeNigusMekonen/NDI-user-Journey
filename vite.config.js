import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // elkjs bundled layout engine is ~1.4MB — loaded on demand in its own chunk
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@xyflow') || id.includes('node_modules/@reactflow')) {
            return 'flow';
          }
          if (id.includes('node_modules/elkjs')) {
            return 'elk';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (
            id.includes('node_modules/react-dom')
            || id.includes('node_modules/react/jsx-runtime')
            || id.includes('node_modules/react/index')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
