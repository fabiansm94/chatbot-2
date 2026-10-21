interface VercelResponse {
  setHeader(key: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
  send(body: unknown): void;
  end(): void;
}

export function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handlePreflight(req: { method?: string }, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    applyCors(res);
    res.status(200).end();
    return true;
  }
  return false;
}
