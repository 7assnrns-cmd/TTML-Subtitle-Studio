import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PORT } from './server/config';
import apiRouter from './server/routes';

async function startServer() {
  const app = express();

  // Increase payload limit for base64 audio uploads
  app.use(express.json({ limit: '64mb' }));
  app.use(express.urlencoded({ extended: true, limit: '64mb' }));

  // Mount modular API routes
  app.use('/', apiRouter);

  // Vite middleware in development or static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TTML Subtitle Studio server running on http://localhost:${PORT}`);
  });
}

startServer();
