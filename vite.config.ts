import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The Firebase SDK alone is ~620 kB; it is split into its own cacheable chunk.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)/ },
            { name: 'vendor', test: /node_modules[\\/](react|react-dom|scheduler|lucide-react)/ },
          ],
        },
      },
    },
  },
});
