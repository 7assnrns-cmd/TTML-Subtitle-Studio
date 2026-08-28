import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PORT } from './server/config';
import apiRouter from './server/routes';

async function startServer() {
  const app = express();

  // Custom CORS and Preflight Options Middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost',
      'capacitor://localhost',
      'http://localhost:3000',
      'https://ais-pre-xzlo5557dhnd2jwtdxkun6-567533425465.europe-west2.run.app',
      'https://ais-dev-xzlo5557dhnd2jwtdxkun6-567533425465.europe-west2.run.app'
    ];

    if (origin) {
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('capacitor://') || origin.endsWith('.run.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Request & Response Logging Middleware
  app.use((req, res, next) => {
    console.log(`[API REQUEST] method=${req.method} path=${req.path}`);
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      console.log(`[API RESPONSE] method=${req.method} path=${req.path} status=${res.statusCode}`);
      return originalEnd.apply(this, arguments as any);
    };
    next();
  });

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
