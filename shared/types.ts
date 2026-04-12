export type RiskLevel = 'low' | 'medium' | 'high';
export type PolicyDecision = 'allow' | 'warn' | 'restrict';
export type ActionType = 'email' | 'link_click' | 'copy_paste' | 'ai_output' | 'file_access' | 'other';

export interface Policy {
  id: string;
  name: string;
  description: string;
  pattern: string;
  riskLevel: RiskLevel;
  decision: PolicyDecision;
  enabled: boolean;
  createdAt: string;
}

export interface UserAction {
  id: string;
  type: ActionType;
  content: string;
  userId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Violation {
  id: string;
  action: UserAction;
  policyId?: string;
  riskLevel: RiskLevel;
  decision: PolicyDecision;
  explanation: string;
  suggestedActions: string[];
  overridden: boolean;
  overrideJustification?: string;
  overriddenAt?: string;
  createdAt: string;
}

export interface OverrideRecord {
  id: string;
  violationId: string;
  userId: string;
  justification: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  event: string;
  details: Record<string, unknown>;
  userId?: string;
  timestamp: string;
}

export interface EvaluationRequest {
  type: ActionType;
  content: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface EvaluationResult {
  decision: PolicyDecision;
  riskLevel: RiskLevel;
  explanation: string;
  suggestedActions: string[];
  violationId?: string;
  matchedPolicies: string[];
}
