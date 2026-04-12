import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export interface ScreenAnalysis {
  hasEmail: boolean;
  hasSuspiciousContent: boolean;
  hasSensitiveData: boolean;
  hasSuspiciousLink: boolean;
  activeApp: string;
  emailDetails?: { subject: string; sender: string; body: string; linksFound: string[] };
  sensitiveDataFound?: string;
  suspiciousLink?: string;
  threatLevel: 'none' | 'low' | 'medium' | 'high';
  sentinelMessage: string | null;
  summary: string;
}

function extractJSON(text: string): unknown {
  try { return JSON.parse(text.trim()); } catch { /* */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* */ } }
  throw new Error('No JSON');
}

export async function analyzeScreen(screenshotBase64: string): Promise<ScreenAnalysis> {
  const message = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: screenshotBase64 } },
        { type: 'text', text: [
          'You are PolicyGuard Screen Monitor. Analyze this screenshot. Respond with JSON only, no markdown.',
          '',
          'TRUSTED SENDERS (do NOT flag as suspicious): amazon.com, google.com, microsoft.com, apple.com, linkedin.com, github.com, slack.com, zoom.us, stripe.com, paypal.com, netflix.com, spotify.com, and any official subdomains of these.',
          '',
          'RULES:',
          '- If Gmail/Outlook is open, set hasEmail=true. Threat level depends on the email content.',
          '- Legitimate marketing emails from known brands (Amazon, Google, etc.) = threatLevel "low", sentinelMessage says it looks safe.',
          '- External sender from unknown domain + urgency keywords (urgent, verify, suspend, click now, bonus, claim, winner, password) = threatLevel "medium" or "high".',
          '- Fake brand domains (paypa1.com, amaz0n.net, mircosoft.com) = threatLevel "high".',
          '- Sensitive data (real salaries, real credentials, internal financial figures) = threatLevel "medium".',
          '- Code editors showing README/demo data = threatLevel "none", sentinelMessage null.',
          '- Security dashboards, admin panels, monitoring tools, or any CyberDog/PolicyGuard dashboard = threatLevel "none", sentinelMessage null. Do NOT flag security tools as threats.',
          '- If screen shows a browser with a localhost URL (localhost:5174, localhost:3001, etc.) = threatLevel "none", sentinelMessage null.',
          '',
          'SENTINEL MESSAGE FORMAT (keep it short, 1-2 sentences):',
          '  Safe email: "This email from [sender] looks legitimate. It appears to be a normal [type] email — safe to read."',
          '  Suspicious: "Warning: This email from [sender] looks suspicious — do NOT click any links until verified."',
          '  Phishing: "DANGER: This appears to be a phishing attempt from [sender]. Do NOT click anything — report to IT immediately."',
          '  Sensitive data: "I spotted sensitive data on your screen ([what]). Make sure you are in a secure environment."',
          '',
          'JSON format:',
          '{',
          '  "hasEmail": true/false,',
          '  "hasSuspiciousContent": true/false,',
          '  "hasSensitiveData": true/false,',
          '  "hasSuspiciousLink": true/false,',
          '  "activeApp": "Gmail|Outlook|Chrome|Word|Excel|VSCode|Slack|Teams|other",',
          '  "emailDetails": { "subject": "if visible", "sender": "if visible", "body": "first 300 chars", "linksFound": [] },',
          '  "sensitiveDataFound": "brief description or null",',
          '  "suspiciousLink": "the URL or null",',
          '  "threatLevel": "none|low|medium|high",',
          '  "sentinelMessage": "short dog message per format above. null if no email or threat visible.",',
          '  "summary": "one sentence: app name + sender + subject or key content"',
          '}',
          '',
          'threatLevel guide:',
          '  none = routine desktop/code editor, no email open',
          '  low = legitimate email open (known brand or safe sender)',
          '  medium = unknown external sender, suspicious keywords, or sensitive data visible',
          '  high = fake domain, phishing indicators, credentials visible',
        ].join('\n') },
      ],
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    return extractJSON(text) as ScreenAnalysis;
  } catch {
    return {
      hasEmail: false, hasSuspiciousContent: false, hasSensitiveData: false,
      hasSuspiciousLink: false, activeApp: 'unknown', threatLevel: 'none',
      sentinelMessage: null, summary: 'Screen could not be analyzed',
    };
  }
}
