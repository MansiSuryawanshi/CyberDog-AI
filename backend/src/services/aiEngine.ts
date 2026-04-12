import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { RiskLevel, PolicyDecision, ActionType } from '../../../shared/types';

dotenv.config();

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

// Extracts JSON even if Claude wraps it in markdown or extra text
function extractJSON(text: string): unknown {
  try { return JSON.parse(text.trim()); } catch { /* continue */ }
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) { try { return JSON.parse(codeBlock[1].trim()); } catch { /* continue */ } }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch { /* continue */ } }
  throw new Error('No valid JSON found in response');
}

// ─── Phishing keyword dictionary ─────────────────────────────────────────────
export const PHISHING_KEYWORDS: Record<string, string[]> = {
  urgency:       ['urgent', 'immediate', 'action required', 'asap', 'time sensitive', 'expires today', 'deadline', 'due now', 'final notice', 'last chance', 'respond immediately'],
  fear:          ['suspicious activity', 'unauthorized access', 'account suspended', 'compromised', 'hacked', 'locked', 'deactivated', 'security alert', 'breach', 'at risk', 'unusual sign-in', 'unusual activity'],
  credential:    ['verify', 'confirm your', 'validate', 'reset password', 'update your information', 'authenticate', 'confirm identity', 'secure your account', 'confirm login', 're-enter', 'sign in now'],
  financial:     ['invoice', 'payment required', 'wire transfer', 'refund', 'bonus', 'reward', 'claim now', 'deposit', 'tax refund', 'billing update', 'unpaid', 'overdue', 'account balance'],
  legal:         ['irs', 'legal action', 'violation', 'penalties', 'court order', 'investigation', 'non-compliance', 'charges filed', 'lawsuit', 'federal'],
  reward:        ['congratulations', 'you have won', 'prize', 'lottery', 'inheritance', 'exclusive deal', 'limited time offer', 'special offer', 'selected', 'lucky winner'],
  impersonation: ['hr department', 'it support', 'payroll', 'helpdesk', 'microsoft support', 'apple support', 'amazon', 'paypal', 'fedex', 'your ceo', 'management team'],
  action:        ['click here', 'open attachment', 'download now', 'view document', 'sign here', 'submit now', 'approve request', 'scan qr', 'open the link'],
};

export function scanEmailKeywords(text: string): { category: string; matched: string[] }[] {
  const lower = text.toLowerCase();
  const results: { category: string; matched: string[] }[] = [];
  for (const [category, keywords] of Object.entries(PHISHING_KEYWORDS)) {
    const matched = keywords.filter((kw) => lower.includes(kw));
    if (matched.length > 0) results.push({ category, matched });
  }
  return results;
}

export function isExternalSender(senderEmail: string, companyDomain: string): boolean {
  const domain = senderEmail.split('@')[1]?.toLowerCase() ?? '';
  return !domain.endsWith(companyDomain.toLowerCase());
}

// ─── General AI Evaluation ────────────────────────────────────────────────────
export interface AIEvaluation {
  riskLevel: RiskLevel;
  decision: PolicyDecision;
  explanation: string;
  suggestedActions: string[];
}

export async function evaluateWithAI(
  actionType: ActionType,
  content: string,
  matchedPolicyNames: string[]
): Promise<AIEvaluation> {
  const policyContext = matchedPolicyNames.length > 0
    ? `The following policies were triggered: ${matchedPolicyNames.join(', ')}.`
    : 'No specific policies were triggered.';

  const message = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are PolicyGuard AI. Evaluate this employee action. Respond with JSON only, no markdown.
Action Type: ${actionType}
Content: ${content}
${policyContext}
JSON: {"riskLevel":"low"|"medium"|"high","decision":"allow"|"warn"|"restrict","explanation":"1-2 sentences for employee","suggestedActions":["action1","action2"]}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    return extractJSON(text) as AIEvaluation;
  } catch {
    return {
      riskLevel: 'medium', decision: 'warn',
      explanation: 'This action could not be fully evaluated. Please proceed with caution.',
      suggestedActions: ['Review before proceeding', 'Consult your manager', 'Contact IT security'],
    };
  }
}

// ─── Email Analysis ───────────────────────────────────────────────────────────
export interface EmailAnalysis {
  isExternal: boolean;
  senderDomain: string;
  threatScore: number;
  riskLevel: RiskLevel;
  decision: PolicyDecision;
  flaggedCategories: { category: string; matched: string[] }[];
  totalFlaggedKeywords: number;
  explanation: string;
  sentinelMessage: string;
  askUserToOpenLinks: boolean;
  linksFound: string[];
}

export async function analyzeEmail(
  subject: string,
  body: string,
  senderEmail: string,
  companyDomain: string,
  linksFound: string[]
): Promise<EmailAnalysis> {
  const isExternal = isExternalSender(senderEmail, companyDomain);
  const senderDomain = senderEmail.split('@')[1] ?? '';
  const flaggedCategories = scanEmailKeywords(`${subject} ${body}`);
  const totalFlaggedKeywords = flaggedCategories.reduce((sum, c) => sum + c.matched.length, 0);
  const keywordSummary = flaggedCategories.map((c) => `${c.category}: [${c.matched.join(', ')}]`).join(' | ');

  const message = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are PolicyGuard Email Defender. Analyze this email. Respond with JSON only, no markdown.
Sender: ${senderEmail} (${isExternal ? 'EXTERNAL - outside company' : 'internal'})
Subject: ${subject}
Body: ${body}
Links: ${linksFound.join(', ') || 'none'}
Pre-detected keywords: ${keywordSummary || 'none'}
JSON: {"threatScore":<0-100>,"riskLevel":"low"|"medium"|"high","decision":"allow"|"warn"|"restrict","explanation":"2-3 sentences for employee","sentinelMessage":"Sentinel dog speaking directly to employee - mention the specific suspicious words like urgent/verify/suspended that were found, say the risk level, ask if user wants Claude to check the links. Friendly, dog emoji, 2-3 sentences.","askUserToOpenLinks":true|false}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    const parsed = extractJSON(text) as Omit<EmailAnalysis, 'isExternal' | 'senderDomain' | 'flaggedCategories' | 'totalFlaggedKeywords' | 'linksFound'>;
    return { ...parsed, isExternal, senderDomain, flaggedCategories, totalFlaggedKeywords, linksFound };
  } catch {
    const score = Math.min(100, totalFlaggedKeywords * 10 + (isExternal ? 20 : 0));
    return {
      isExternal, senderDomain, threatScore: score,
      riskLevel: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
      decision: score >= 60 ? 'restrict' : score >= 30 ? 'warn' : 'allow',
      flaggedCategories, totalFlaggedKeywords,
      explanation: `This email triggered ${totalFlaggedKeywords} phishing keyword(s) from an ${isExternal ? 'external' : 'internal'} sender.`,
      sentinelMessage: `Woof! I spotted suspicious words in this email${isExternal ? ' from an outside sender' : ''}. Be careful!`,
      askUserToOpenLinks: linksFound.length > 0 && score >= 30,
      linksFound,
    };
  }
}

// ─── Link Analysis ────────────────────────────────────────────────────────────
export interface LinkAnalysis {
  riskLevel: RiskLevel;
  decision: PolicyDecision;
  isSafe: boolean;
  phishingProbability: number;
  explanation: string;
  redFlags: string[];
  suggestedActions: string[];
  sentinelMessage: string;
}

export async function analyzeLink(url: string, emailContext?: string): Promise<LinkAnalysis> {
  let parsedDomain = '';
  try { parsedDomain = new URL(url).hostname; } catch { parsedDomain = url; }

  const message = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are PolicyGuard Email Defender. Analyze this link. Respond with JSON only, no markdown.
URL: ${url}
Domain: ${parsedDomain}
${emailContext ? `Email context: ${emailContext}` : ''}
Check for: URL shorteners, lookalike domains (paypa1/g00gle/amaz0n), suspicious TLDs (.xyz .tk .pw), raw IPs, urgency keywords in URL, HTTP on sensitive sites, mismatched brand names.
JSON: {"riskLevel":"low"|"medium"|"high","decision":"allow"|"warn"|"restrict","isSafe":true|false,"phishingProbability":<0-100>,"explanation":"1-2 sentences for employee","redFlags":["flag1","flag2"],"suggestedActions":["action1","action2"],"sentinelMessage":"Sentinel dog telling user the phishing probability percentage and whether to open the link, dog emoji, 1-2 sentences"}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    return extractJSON(text) as LinkAnalysis;
  } catch {
    return {
      riskLevel: 'high', decision: 'restrict', isSafe: false, phishingProbability: 85,
      explanation: 'This link could not be fully analyzed. Do not open it.',
      redFlags: ['Unable to analyze link'],
      suggestedActions: ['Do not click the link', 'Report to IT security', 'Contact sender by phone'],
      sentinelMessage: 'Woof! I could not analyze this link - 85% chance it is dangerous. Check with IT!',
    };
  }
}

// ─── Visual Link Analysis (Claude Vision + Puppeteer) ────────────────────────
export interface VisualLinkAnalysis {
  phishingProbability: number;
  riskLevel: RiskLevel;
  decision: PolicyDecision;
  whatClaudeSees: string;
  redFlags: string[];
  pageTitle: string;
  finalUrl: string;
  hadRedirect: boolean;
  sentinelMessage: string;
}

export async function analyzeUrlVisually(
  imageBase64: string,
  originalUrl: string,
  finalUrl: string,
  pageTitle: string,
  hadRedirect: boolean
): Promise<VisualLinkAnalysis> {
  const message = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
        {
          type: 'text',
          text: `You are PolicyGuard Email Defender with vision. Analyze this screenshot. Respond with JSON only, no markdown.
Original URL: ${originalUrl}
Final URL: ${finalUrl}
Page title: ${pageTitle}
Had redirect: ${hadRedirect}
Look for: fake login forms, spoofed brand logos, urgency messages, mismatched branding, poor design/grammar, fake CAPTCHA.
JSON: {"phishingProbability":<0-100>,"riskLevel":"low"|"medium"|"high","decision":"allow"|"warn"|"restrict","whatClaudeSees":"2-3 sentences describing what the page looks like and why suspicious or safe","redFlags":["flag1"],"sentinelMessage":"Sentinel dog telling user what Claude saw on the page and the phishing probability percentage, dog emoji, 2-3 sentences"}`,
        },
      ],
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    const parsed = extractJSON(text) as Omit<VisualLinkAnalysis, 'pageTitle' | 'finalUrl' | 'hadRedirect'>;
    return { ...parsed, pageTitle, finalUrl, hadRedirect };
  } catch {
    return {
      phishingProbability: 75, riskLevel: 'high', decision: 'restrict',
      whatClaudeSees: 'The page could not be analyzed visually. Exercise extreme caution.',
      redFlags: ['Visual analysis failed'], pageTitle, finalUrl, hadRedirect,
      sentinelMessage: 'Woof! I opened the link but had trouble reading it. 75% chance it is dangerous - stay away!',
    };
  }
}

// ─── Copy-Paste Guard ─────────────────────────────────────────────────────────
export interface CopyPasteAnalysis {
  riskLevel: RiskLevel;
  decision: PolicyDecision;
  containsSensitiveInfo: boolean;
  sensitiveCategories: string[];
  explanation: string;
  policyViolated: string;
  sentinelMessage: string;
  suggestedActions: string[];
}

export async function analyzeCopyPaste(
  content: string,
  matchedPolicyNames: string[]
): Promise<CopyPasteAnalysis> {
  const policyContext = matchedPolicyNames.length > 0
    ? `These company policies were triggered: ${matchedPolicyNames.join(', ')}.`
    : 'No specific policies matched but general sensitivity check is needed.';

  const message = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are PolicyGuard Copy-Paste Guard. An employee just copied this text. Analyze if it contains sensitive company information. Respond with JSON only, no markdown.

Copied text: "${content}"
${policyContext}

Check for: confidential documents, financial data (revenue/salary/budget), customer PII, credentials (passwords/API keys/tokens), internal communications, trade secrets, source code with secrets, HR data.

JSON: {"riskLevel":"low"|"medium"|"high","decision":"allow"|"warn"|"restrict","containsSensitiveInfo":true|false,"sensitiveCategories":["category1","category2"],"explanation":"2-3 sentences explaining what sensitive info was found and why it violates company policy","policyViolated":"name of the policy violated or 'none'","sentinelMessage":"Sentinel dog speaking directly to employee - mention what sensitive info was detected, cite the specific company policy being violated, ask if they really need to copy this. Firm but friendly, dog emoji, 2-3 sentences.","suggestedActions":["action1","action2","action3"]}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    return extractJSON(text) as CopyPasteAnalysis;
  } catch {
    return {
      riskLevel: 'high', decision: 'restrict', containsSensitiveInfo: true,
      sensitiveCategories: ['unknown'],
      explanation: 'This content could not be analyzed but may contain sensitive company information.',
      policyViolated: 'Copy-Paste Guard — Confidential Data',
      sentinelMessage: 'Woof! I spotted something that might be sensitive company info. Please check with your manager before sharing this!',
      suggestedActions: ['Do not paste this externally', 'Check with your manager', 'Review the data sharing policy'],
    };
  }
}

// ─── Sentinel Chat ────────────────────────────────────────────────────────────
export async function getSentinelResponse(userMessage: string, context: string): Promise<string> {
  const message = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `You are Sentinel, a friendly AI security companion (a dog) in the PolicyGuard system. Help employees understand security risks. Keep responses short (2-3 sentences), friendly, and actionable. Context: ${context}`,
    messages: [{ role: 'user', content: userMessage }],
  });
  return message.content[0].type === 'text' ? message.content[0].text : "I'm here to help keep you safe!";
}
