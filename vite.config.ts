import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      /**
       * No source maps in the production bundle.
       *
       * They added 2.6 MB to every deployment and published the complete
       * original TypeScript alongside it. Neither is wanted on a public site.
       * Set VITE_SOURCEMAP=1 when you genuinely need to debug a built bundle.
       */
      sourcemap: process.env.VITE_SOURCEMAP === '1',
      chunkSizeWarningLimit: 1000,
    },
  };
});
