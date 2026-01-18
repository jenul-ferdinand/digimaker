import express, { Express } from 'express';
import { Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the frontend dist path relative to package location
// In development: packages/core/src -> packages/frontend/dist/frontend/browser
// In production (built): packages/core/dist -> packages/frontend/dist/frontend/browser
function resolveFrontendPath(): string {
  // Check if we're running from dist (production) or src (development)
  const isBuilt = __dirname.includes('/dist');

  if (isBuilt) {
    // From packages/core/dist -> packages/frontend/dist/frontend/browser
    return path.resolve(__dirname, '../../frontend/dist/frontend/browser');
  } else {
    // From packages/core/src -> packages/frontend/dist/frontend/browser
    return path.resolve(__dirname, '../../frontend/dist/frontend/browser');
  }
}

export interface ServerInstance {
  app: Express;
  server: Server;
  port: number;
  url: string;
}

export async function startServer(): Promise<ServerInstance> {
  const app = express();
  const frontendPath = resolveFrontendPath();

  app.use(express.static(frontendPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to get server address'));
        return;
      }

      const port = address.port;
      const url = `http://localhost:${port}`;

      logger.info(`[Server] Running at ${url}`);
      resolve({ app, server, port, url });
    });

    server.on('error', reject);
  });
}

export async function stopServer(instance: ServerInstance): Promise<void> {
  return new Promise((resolve, reject) => {
    instance.server.close((err) => {
      if (err) reject(err);
      else {
        logger.info('[Server] Stopped');
        resolve();
      }
    });
  });
}
