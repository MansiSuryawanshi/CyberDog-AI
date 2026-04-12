import { Router, Request, Response } from 'express';
import { getAllPolicies, getPolicyById, createPolicy, updatePolicy, deletePolicy, createAuditLog } from '../services/database';
import { broadcastEvent } from '../sse/stream';
import { Policy } from '../../../shared/types';

const router = Router();

router.get('/', (_req: Request, res: Response) => { res.json(getAllPolicies()); });

router.get('/:id', (req: Request, res: Response) => {
  const policy = getPolicyById(req.params.id);
  if (!policy) return res.status(404).json({ error: 'Policy not found' });
  res.json(policy);
});

router.post('/', (req: Request, res: Response) => {
  const { name, description, pattern, riskLevel, decision, enabled } = req.body as Partial<Policy>;
  if (!name || !pattern || !riskLevel || !decision) {
    return res.status(400).json({ error: 'name, pattern, riskLevel, and decision are required' });
  }
  const policy = createPolicy({ name, description: description ?? '', pattern, riskLevel, decision, enabled: enabled ?? true });
  createAuditLog('policy_created', { policyId: policy.id, name: policy.name });
  broadcastEvent('policy_update', { action: 'created', policy });
  res.status(201).json(policy);
});

router.put('/:id', (req: Request, res: Response) => {
  const updated = updatePolicy(req.params.id, req.body as Partial<Policy>);
  if (!updated) return res.status(404).json({ error: 'Policy not found' });
  createAuditLog('policy_updated', { policyId: updated.id });
  broadcastEvent('policy_update', { action: 'updated', policy: updated });
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const policy = getPolicyById(req.params.id);
  if (!policy) return res.status(404).json({ error: 'Policy not found' });
  deletePolicy(req.params.id);
  createAuditLog('policy_deleted', { policyId: req.params.id });
  broadcastEvent('policy_update', { action: 'deleted', policyId: req.params.id });
  res.json({ success: true });
});

export default router;
