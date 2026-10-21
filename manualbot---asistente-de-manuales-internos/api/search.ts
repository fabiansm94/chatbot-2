interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  setHeader(key: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
  send(body: unknown): void;
  end(): void;
}

import { handleSearchRequest } from './_lib/manualBot';
import { applyCors, handlePreflight } from './_lib/cors';

export default function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { status, body: payload } = handleSearchRequest(body);

  res.status(status).json(payload);
}
