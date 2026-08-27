import type { Plugin } from 'vite';
import { createLiveMiddleware } from './liveMiddleware.ts';

export function azureDevOpsLivePlugin(): Plugin {
  return {
    name: 'ado-live-readonly',
    configureServer(server) {
      server.middlewares.use(createLiveMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createLiveMiddleware());
    },
  };
}
