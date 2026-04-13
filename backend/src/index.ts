import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import policiesRouter from './routes/policies';
import violationsRouter from './routes/violations';
import overrideRouter from './routes/override';
import emailDefenderRouter from './routes/emailDefender';
import copyPasteGuardRouter from './routes/copyPasteGuard';
import monitorRouter from './routes/monitor';
import { addSSEClient, getClientCount } from './sse/stream';
import { generateAssistantResponse, ChatMessage } from './services/policyAssistantService';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/policies', policiesRouter);
app.use('/api/violations', violationsRouter);
app.use('/api/override', overrideRouter);
app.use('/api/email-defender', emailDefenderRouter);
app.use('/api/copy-paste', copyPasteGuardRouter);
app.use('/api/monitor', monitorRouter);

// SSE — real-time event stream for the frontend
app.get('/api/stream', (req, res) => {
  const clientId = (req.query.clientId as string) ?? uuidv4();
  addSSEClient(clientId, res);
  console.log('SSE client connected:', clientId, '| total:', getClientCount());
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0-CLAUDE-SYNC',
    service: 'PolicyGuard AI Backend',
    sseClients: getClientCount(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Policy Assistant Chat ───────────────────────────────────────────────────
let conversationHistory: ChatMessage[] = [];

app.post('/api/policy/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log('🤖 Policy Assistant — Incoming message:', message);

  try {
    const response = await generateAssistantResponse(message, conversationHistory);
    
    console.log('📊 Policy Assistant — Detected topic:', (response as any).topic);
    console.log('📝 Policy Assistant — Response type:', (response as any).type);

    // Update history
    conversationHistory.push({ role: 'user', message });
    conversationHistory.push({ role: 'ai', message: (response as any).text });

    // Keep history manageable
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    res.json(response);
  } catch (error) {
    console.error('❌ Policy Assistant — Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(PORT, () => {
  console.log('🚀 SENTINEL v2.0 — PolicyGuard AI backend active');
  console.log('🔗 Endpoint: http://localhost:' + PORT + '/api/policy/chat');
  console.log('🩺 Health:   http://localhost:' + PORT + '/api/health');
});
