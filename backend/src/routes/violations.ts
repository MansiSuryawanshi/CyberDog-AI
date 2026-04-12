import { Router, Request, Response } from 'express';
import { getAllViolations, getViolationById, getAllAuditLogs } from '../services/database';
import { evaluateAction } from '../services/policyEngine';
import { broadcastEvent } from '../sse/stream';
import { EvaluationRequest } from '../../../shared/types';

const router = Router();

router.get('/', (_req: Request, res: Response) => { res.json(getAllViolations()); });

router.get('/audit/logs', (_req: Request, res: Response) => { res.json(getAllAuditLogs()); });

router.get('/:id', (req: Request, res: Response) => {
  const v = getViolationById(req.params.id);
  if (!v) return res.status(404).json({ error: 'Violation not found' });
  res.json(v);
});

router.post('/evaluate', async (req: Request, res: Response) => {
  const { type, content, userId, metadata } = req.body as Partial<EvaluationRequest>;
  if (!type || !content || !userId) {
    return res.status(400).json({ error: 'type, content, and userId are required' });
  }
  try {
    const result = await evaluateAction({ type, content, userId, metadata });
    if (result.decision !== 'allow' && result.violationId) {
      broadcastEvent('violation', {
        violationId: result.violationId,
        decision: result.decision,
        riskLevel: result.riskLevel,
        userId,
      });
    }
    res.json(result);
  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

export default router;
