import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { policyKnowledge, PolicySection } from './policyKnowledge';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
}

export interface AssistantResponse {
  text: string;
  type: 'policy' | 'clarification' | 'escalation';
  topic: string;
}

export function detectIntent(message: string, history: ChatMessage[]): 'question' | 'follow_up' | 'unclear' | 'policy_query' {
  const msg = message.toLowerCase();
  
  if (msg.length < 5) return 'unclear';
  if (msg.includes('?') || msg.startsWith('how') || msg.startsWith('what') || msg.startsWith('where') || msg.startsWith('can i')) return 'question';
  if (msg.includes('what about') || msg.includes('and ') || msg.startsWith('how about')) return 'follow_up';
  
  return 'policy_query';
}

export function classifyTopic(message: string, history: ChatMessage[]): string {
  const msg = message.toLowerCase();

  // Keyword mapping with improved precision using regex whole-word matching
  if (/\b(leave|vacation|sick|parental|time off|pto)\b/.test(msg))
    return 'leave';

  if (/\b(remote|wfh|work from home|hybrid|office|workspace)\b/.test(msg))
    return 'workplace';

  if (/\b(expense|reimbursement|travel|stipend|receipt)\b/.test(msg))
    return 'expenses';

  if (/\b(password|security|mfa|encryption|suspicious|link|links|email|mail|phishing|login|hack)\b/i.test(msg))
    return 'security';

  if (/\b(conduct|ethical|harassment|confidential|ethics|policy)\b/.test(msg))
    return 'conduct';

  // Context fallback from history
  if (history.length > 0) {
    const lastAIReply = history.filter(h => h.role === 'ai').pop();
    if (lastAIReply) {
      const txt = lastAIReply.message.toLowerCase();
      if (txt.includes('leave')) return 'leave';
      if (txt.includes('workplace') || txt.includes('remote')) return 'workplace';
      if (txt.includes('expense')) return 'expenses';
      if (txt.includes('security') || txt.includes('email')) return 'security';
      if (txt.includes('conduct')) return 'conduct';
    }
  }

  return 'unknown';
}

export async function generateAssistantResponse(message: string, history: ChatMessage[]): Promise<AssistantResponse> {
  const intent = detectIntent(message, history);
  const topic = classifyTopic(message, history);
  
  console.log(`🤖 [Sentinel AI v2.0] Incoming: "${message}"`);
  console.log(`🔍 [Sentinel AI v2.0] Intent: ${intent}, Topic: ${topic}`);

  const context = (policyKnowledge as any)[topic];
  const contextText = context 
    ? `POLICY CONTEXT (${context.title}):\n${context.points.map((p: string) => `- ${p}`).join('\n')}`
    : "No specific policy context found for this topic.";

  console.log(`📚 [Sentinel AI v2.0] Context status: ${context ? 'Found' : 'Not found'}`);

  try {
    const systemPrompt = `You are Sentinel, a friendly and intelligent AI security companion (a dog) for CyberDog AI. 
      Your goal is to help employees understand company policies based ONLY on the provided context.
      
      RULES:
      1. ALWAYS be friendly and maintain a subtle 'dog' persona (e.g., occasional helpful woof!).
      2. ONLY answer using the "POLICY CONTEXT" provided below.
      3. If the answer is not in the context, politely state that you couldn't find it in the current handbook and suggest they contact HR at hr@cyberdog.ai or escalate to security.
      4. Do NOT make up policies.
      5. Use markdown for bolding and lists to make responses readable.
      
      ${contextText}`;

    const claudeMessages: any[] = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.message
    }));
    
    claudeMessages.push({ role: 'user', content: message });

    console.log(`📡 [Sentinel AI] Calling Claude API...`);
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const replyText = response.content[0].type === 'text' ? response.content[0].text : "Woof! I'm having a little trouble thinking right now. Please try again!";
    
    console.log(`✅ [Sentinel AI] Claude responded successfully.`);

    return {
      text: `[SENTINEL-v2-AI]\n\n${replyText}`,
      type: context ? 'policy' : 'escalation',
      topic: topic
    };
  } catch (error: any) {
    console.error(`❌ [Sentinel AI] Error calling Claude:`, error.message);
    return {
      text: "Woof! My connection to the brain is a bit fuzzy. Can you try asking me again in a moment?",
      type: 'escalation',
      topic: topic
    };
  }
}
