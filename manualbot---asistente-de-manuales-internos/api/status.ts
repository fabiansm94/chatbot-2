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

import { buildStatusPayload } from './_lib/manualBot';
import { applyCors, handlePreflight } from './_lib/cors';

export default function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (handlePreflight(req, res)) return;

  res.status(200).json(buildStatusPayload());
}
