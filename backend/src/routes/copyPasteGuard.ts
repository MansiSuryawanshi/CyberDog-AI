import { Router, Request, Response } from 'express';
import { analyzeCopyPaste } from '../services/aiEngine';
import { getAllPolicies, createViolation, createAuditLog } from '../services/database';
import { broadcastEvent } from '../sse/stream';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/copy-paste/check
router.post('/check', async (req: Request, res: Response) => {
  const { content, userId, destination } = req.body as {
    content?: string; userId?: string; destination?: string;
  };

  if (!content || !userId) return res.status(400).json({ error: 'content and userId are required' });
  if (content.trim().length < 10) return res.status(200).json({ decision: 'allow', riskLevel: 'low', containsSensitiveInfo: false, sentinelMessage: null });

  const policies = getAllPolicies().filter((p) => p.enabled && p.name.includes('Copy-Paste'));
  const matchedPolicies = policies.filter((p) => {
    try { return new RegExp(p.pattern, 'i').test(content); } catch { return false; }
  });

  try {
    const analysis = await analyzeCopyPaste(content, matchedPolicies.map((p) => p.name));
    let violationId: string | undefined;

    if (analysis.containsSensitiveInfo && analysis.decision !== 'allow') {
      const action = {
        id: uuidv4(), type: 'copy_paste' as const,
        content: content.substring(0, 500),
        userId, timestamp: new Date().toISOString(),
        metadata: { destination: destination ?? 'unknown', matchedPolicies: matchedPolicies.map((p) => p.name), sensitiveCategories: analysis.sensitiveCategories, contentLength: content.length },
      };
      const violation = createViolation({
        action, policyId: matchedPolicies[0]?.id,
        riskLevel: analysis.riskLevel, decision: analysis.decision,
        explanation: analysis.explanation, suggestedActions: analysis.suggestedActions,
      });
      violationId = violation.id;

      broadcastEvent('copy_paste_violation', {
        violationId, userId, riskLevel: analysis.riskLevel, decision: analysis.decision,
        sensitiveCategories: analysis.sensitiveCategories,
        policyViolated: analysis.policyViolated,
        sentinelMessage: analysis.sentinelMessage, destination,
      });
    }

    createAuditLog('copy_paste_checked', {
      userId, containsSensitiveInfo: analysis.containsSensitiveInfo,
      riskLevel: analysis.riskLevel, decision: analysis.decision,
      matchedPolicies: matchedPolicies.map((p) => p.name), violationId,
    }, userId);

    res.json({ ...analysis, violationId });
  } catch (err) {
    console.error('Copy-paste check error:', err);
    res.status(500).json({ error: 'Copy-paste analysis failed' });
  }
});

// GET /api/copy-paste/violations
router.get('/violations', (_req: Request, res: Response) => {
  const { getAllViolations } = require('../services/database');
  const all = getAllViolations();
  res.json(all.filter((v: { action: { type: string } }) => v.action.type === 'copy_paste'));
});

export default router;
