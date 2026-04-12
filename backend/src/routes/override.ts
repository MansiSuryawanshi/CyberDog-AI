import { Router, Request, Response } from 'express';
import { getAllOverrides, createOverride, markViolationOverridden, getViolationById, createAuditLog } from '../services/database';
import { broadcastEvent } from '../sse/stream';
import { getSentinelResponse } from '../services/aiEngine';

const router = Router();

router.get('/', (_req: Request, res: Response) => { res.json(getAllOverrides()); });

router.post('/', async (req: Request, res: Response) => {
  const { violationId, userId, justification } = req.body as {
    violationId?: string; userId?: string; justification?: string;
  };
  if (!violationId || !userId || !justification) {
    return res.status(400).json({ error: 'violationId, userId, and justification are required' });
  }
  if (justification.trim().length < 10) {
    return res.status(400).json({ error: 'Justification must be at least 10 characters' });
  }
  const violation = getViolationById(violationId);
  if (!violation) return res.status(404).json({ error: 'Violation not found' });
  if (violation.decision === 'restrict') {
    return res.status(403).json({ error: 'Restricted actions cannot be overridden. Contact your administrator.' });
  }
  const override = createOverride({ violationId, userId, justification });
  const updated = markViolationOverridden(violationId, justification);
  createAuditLog('override_submitted', { violationId, userId, justification });
  broadcastEvent('override', { overrideId: override.id, violationId, userId });
  const sentinelMessage = await getSentinelResponse(
    'User overriding warning. Justification: ' + justification,
    'Original violation: ' + violation.explanation
  ).catch(() => 'Override noted. Stay safe!');
  res.json({ override, violation: updated, sentinelMessage });
});

router.post('/sentinel', async (req: Request, res: Response) => {
  const { message, context } = req.body as { message?: string; context?: string };
  if (!message) return res.status(400).json({ error: 'message is required' });
  try {
    const reply = await getSentinelResponse(message, context ?? '');
    res.json({ reply });
  } catch (err) {
    console.error('Sentinel error:', err);
    res.status(500).json({ error: 'Sentinel unavailable' });
  }
});

export default router;
