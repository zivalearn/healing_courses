import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { handleVideoApiRequest } from './server/api/videoHandler';
import { handleMediaApiRequest } from './server/api/mediaHandler';
import { handleZivaMediaApiRequest } from './server/api/ziva/zivaMediaHandler';
import { handleZivaVideoApiRequest } from './server/api/ziva/zivaVideoHandler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS configuration
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
      exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type', 'Content-Disposition'],
    })
  );

  // Body parsing for JSON and URL-encoded
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Heal With Heer LMS API' });
  });

  // Media API handler
  app.use('/api/media', async (req, res) => {
    try {
      const handled = await handleMediaApiRequest(req, res);
      if (handled) return;
      if (!res.headersSent) {
        res.status(404).json({ ok: false, error: `Media API endpoint not found: ${req.originalUrl}` });
      }
    } catch (err: any) {
      console.error('[Media API Route Error]', err);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: err.message || 'Internal server error in media handler' });
      }
    }
  });

  // Video API handler
  app.use('/api/video', async (req, res) => {
    try {
      const handled = await handleVideoApiRequest(req, res);
      if (handled) return;
      if (!res.headersSent) {
        res.status(404).json({ ok: false, error: `Video API endpoint not found: ${req.originalUrl}` });
      }
    } catch (err: any) {
      console.error('[Video API Route Error]', err);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: err.message || 'Internal server error in video handler' });
      }
    }
  });

  // Ziva Media API handler
  app.use('/api/ziva/media', async (req, res) => {
    try {
      const handled = await handleZivaMediaApiRequest(req, res);
      if (handled) return;
      if (!res.headersSent) {
        res.status(404).json({ ok: false, error: `Ziva Media API endpoint not found: ${req.originalUrl}` });
      }
    } catch (err: any) {
      console.error('[Ziva Media API Route Error]', err);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: err.message || 'Internal server error in Ziva media handler' });
      }
    }
  });

  // Ziva Video API handler
  app.use('/api/ziva/video', async (req, res) => {
    try {
      const handled = await handleZivaVideoApiRequest(req, res);
      if (handled) return;
      if (!res.headersSent) {
        res.status(404).json({ ok: false, error: `Ziva Video API endpoint not found: ${req.originalUrl}` });
      }
    } catch (err: any) {
      console.error('[Ziva Video API Route Error]', err);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: err.message || 'Internal server error in Ziva video handler' });
      }
    }
  });

  // Strict JSON catch-all for any other /api/* route so it NEVER falls through to HTML
  app.use('/api', (req, res) => {
    res.status(404).json({ ok: false, error: `Endpoint not found: ${req.originalUrl}` });
  });

  // Vite dev middleware or production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Heal With Heer LMS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Heal With Heer LMS] Failed to start server:', err);
  process.exit(1);
});

