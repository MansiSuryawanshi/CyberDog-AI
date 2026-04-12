import { v4 as uuidv4 } from 'uuid';
import { EvaluationRequest, EvaluationResult, Policy } from '../../../shared/types';
import { getAllPolicies, createViolation, createAuditLog } from './database';
import { evaluateWithAI } from './aiEngine';

function matchesPattern(content: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(content);
  } catch {
    return content.toLowerCase().includes(pattern.toLowerCase());
  }
}

export async function evaluateAction(request: EvaluationRequest): Promise<EvaluationResult> {
  const { type, content, userId, metadata } = request;

  const policies = getAllPolicies().filter((p) => p.enabled);
  const matchedPolicies: Policy[] = [];

  for (const policy of policies) {
    if (matchesPattern(content, policy.pattern)) {
      matchedPolicies.push(policy);
    }
  }

  // Get AI evaluation (passes matched policy names for context)
  const aiResult = await evaluateWithAI(
    type,
    content,
    matchedPolicies.map((p) => p.name)
  );

  // Use strictest decision if policies matched
  let finalDecision = aiResult.decision;
  let finalRisk = aiResult.riskLevel;
  let primaryPolicyId: string | undefined;

  if (matchedPolicies.length > 0) {
    const restrictMatch = matchedPolicies.find((p) => p.decision === 'restrict');
    const warnMatch = matchedPolicies.find((p) => p.decision === 'warn');
    const strictest = restrictMatch ?? warnMatch ?? matchedPolicies[0];

    primaryPolicyId = strictest.id;
    // Upgrade decision/risk if policy is stricter
    if (strictest.decision === 'restrict') {
      finalDecision = 'restrict';
      if (strictest.riskLevel === 'high') finalRisk = 'high';
    } else if (strictest.decision === 'warn' && finalDecision === 'allow') {
      finalDecision = 'warn';
      if (strictest.riskLevel === 'medium' && finalRisk === 'low') finalRisk = 'medium';
    }
  }

  const action = {
    id: uuidv4(),
    type,
    content,
    userId,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Log violation if not allowed
  let violationId: string | undefined;
  if (finalDecision !== 'allow') {
    const violation = createViolation({
      action,
      policyId: primaryPolicyId,
      riskLevel: finalRisk,
      decision: finalDecision,
      explanation: aiResult.explanation,
      suggestedActions: aiResult.suggestedActions,
    });
    violationId = violation.id;
  }

  // Always audit log
  createAuditLog('action_evaluated', {
    actionType: type,
    decision: finalDecision,
    riskLevel: finalRisk,
    matchedPolicies: matchedPolicies.map((p) => p.id),
    violationId,
  }, userId);

  return {
    decision: finalDecision,
    riskLevel: finalRisk,
    explanation: aiResult.explanation,
    suggestedActions: aiResult.suggestedActions,
    violationId,
    matchedPolicies: matchedPolicies.map((p) => p.id),
  };
}
