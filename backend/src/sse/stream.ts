import { Response } from 'express';

interface SSEClient { id: string; res: Response; }
const clients: SSEClient[] = [];

export function addSSEClient(id: string, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  const msg = JSON.stringify({ clientId: id });
  res.write(`event: connected
data: ${msg}

`);
  clients.push({ id, res });
  res.on('close', () => removeSSEClient(id));
}

export function removeSSEClient(id: string): void {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx !== -1) clients.splice(idx, 1);
}

export function broadcastEvent(eventType: string, data: unknown): void {
  const payload = `event: ${eventType}
data: ${JSON.stringify(data)}

`;
  for (const client of clients) {
    try { client.res.write(payload); } catch { removeSSEClient(client.id); }
  }
}

export function getClientCount(): number { return clients.length; }
