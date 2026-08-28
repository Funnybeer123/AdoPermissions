/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { azureDevOpsLivePlugin } from './server/livePlugin.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.AZURE_DEVOPS_ORG) {
    process.env.AZURE_DEVOPS_ORG = env.AZURE_DEVOPS_ORG;
  }
  if (env.AZURE_DEVOPS_PAT) {
    process.env.AZURE_DEVOPS_PAT = env.AZURE_DEVOPS_PAT;
  }

  return {
  plugins: [react(), azureDevOpsLivePlugin()],
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
};
});
