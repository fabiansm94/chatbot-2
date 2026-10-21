import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleChatRequest,
  handleSearchRequest,
  buildStatusPayload,
  getAiClient,
  isGeminiConfigured
} from './api/_lib/manualBot.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for embedding into external company websites / intranets
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Provide embeddable floating widget JavaScript bundle
app.get('/widget.js', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.resolve(__dirname, 'public', 'widget.js'));
});

// System status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  res.json(buildStatusPayload());
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { status, body } = await handleChatRequest(req.body || {});
  res.status(status).json(body);
});

// Search manual articles directly
app.post('/api/search', (req: Request, res: Response) => {
  const { status, body } = handleSearchRequest(req.body || {});
  res.status(status).json(body);
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ManualBot Server] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[ManualBot Server] Gemini AI: ${isGeminiConfigured() ? 'enabled' : 'disabled (local engine)'}`);
    getAiClient();
  });
}

startServer().catch(err => {
  console.error('[ManualBot Server] Failed to start server:', err);
});
