interface VercelRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
}

interface VercelResponse {
  setHeader(key: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
  send(body: unknown): void;
  end(): void;
}

import { handleChatRequest } from './_lib/manualBot';
import { applyCors, handlePreflight } from './_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { status, body: payload } = await handleChatRequest(body);

  res.status(status).json(payload);
}
