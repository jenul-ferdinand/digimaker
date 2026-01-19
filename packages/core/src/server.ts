import express, { Express } from 'express';
import fs from 'fs';
import { Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the frontend dist path
// Priority order:
// 1. DIGIMAKER_FRONTEND_PATH env var (for custom setups)
// 2. Bundled with CLI package (npm global install): @digimaker/cli/dist/frontend/browser
// 3. Monorepo sibling (development): packages/frontend/dist/frontend/browser
function resolveFrontendPath(): string {
  // 1. Check for environment variable override
  if (process.env.DIGIMAKER_FRONTEND_PATH) {
    const envPath = process.env.DIGIMAKER_FRONTEND_PATH;
    if (fs.existsSync(envPath)) {
      logger.debug(`[Server] Using frontend from DIGIMAKER_FRONTEND_PATH: ${envPath}`);
      return envPath;
    }
    logger.warn(`[Server] DIGIMAKER_FRONTEND_PATH set but path not found: ${envPath}`);
  }

  // 2. Check if running from CLI package (npm global install)
  // When installed globally, the structure can vary based on npm hoisting
  // Frontend is bundled at @digimaker/cli/dist/frontend/browser
  const cliModulePaths = [
    // npm global install (hoisted): @digimaker/core and @digimaker/cli are siblings
    path.resolve(__dirname, '../cli/dist/frontend/browser'),
    path.resolve(__dirname, '../../cli/dist/frontend/browser'),
    // npm global install (nested): core is inside cli's node_modules
    path.resolve(__dirname, '../../../../dist/frontend/browser'),
    path.resolve(__dirname, '../../../dist/frontend/browser'),
    // Same directory (if frontend is bundled with core)
    path.resolve(__dirname, './frontend/browser'),
    path.resolve(__dirname, '../frontend/browser'),
  ];

  for (const cliPath of cliModulePaths) {
    if (fs.existsSync(cliPath)) {
      logger.debug(`[Server] Using bundled frontend from CLI package: ${cliPath}`);
      return cliPath;
    }
  }

  // 3. Monorepo development: sibling frontend package
  const monorepoPath = path.resolve(__dirname, '../../frontend/dist/frontend/browser');
  if (fs.existsSync(monorepoPath)) {
    logger.debug(`[Server] Using frontend from monorepo: ${monorepoPath}`);
    return monorepoPath;
  }

  // Fallback: return monorepo path and let it fail with a clear error
  logger.error(`[Server] Frontend assets not found. Checked paths:`);
  logger.error(`  - ${cliModulePaths.join('\n  - ')}`);
  logger.error(`  - ${monorepoPath}`);
  return monorepoPath;
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
