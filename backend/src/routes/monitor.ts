import { Router, Request, Response } from 'express';
import { startMonitor, stopMonitor, getMonitorStatus } from '../services/screenMonitor';

const router = Router();

// POST /api/monitor/start
router.post('/start', (req: Request, res: Response) => {
  const { intervalMs } = req.body as { intervalMs?: number };
  const interval = Math.max(2000, intervalMs ?? 4000); // minimum 2 seconds
  startMonitor(interval);
  res.json({ success: true, message: `Screen monitor started. Capturing every ${interval}ms.`, status: getMonitorStatus() });
});

// POST /api/monitor/stop
router.post('/stop', (_req: Request, res: Response) => {
  stopMonitor();
  res.json({ success: true, message: 'Screen monitor stopped.', status: getMonitorStatus() });
});

// GET /api/monitor/status
router.get('/status', (_req: Request, res: Response) => {
  res.json(getMonitorStatus());
});

export default router;
