import express, { Express } from 'express';
import { Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In development (running from src/), use the frontend build from ../frontend
// In production (running from dist/cli/src/), use the bundled frontend in dist/frontend
const ANGULAR_DIST_PATH = __dirname.includes('/dist')
  ? path.resolve(__dirname, '../../frontend')
  : path.resolve(__dirname, '../../frontend/dist/frontend/browser');

export interface ServerInstance {
  app: Express;
  server: Server;
  port: number;
  url: string;
}

export async function startServer(): Promise<ServerInstance> {
  const app = express();

  app.use(express.static(ANGULAR_DIST_PATH));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(ANGULAR_DIST_PATH, 'index.html'));
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
