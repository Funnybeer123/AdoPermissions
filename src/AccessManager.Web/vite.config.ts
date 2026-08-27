/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4780,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4780,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    server: {
      deps: {
        inline: [/@fluentui/, 'tabster'],
      },
    },
  },
});
