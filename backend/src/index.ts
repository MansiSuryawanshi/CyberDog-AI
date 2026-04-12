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
    service: 'PolicyGuard AI Backend',
    sseClients: getClientCount(),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log('PolicyGuard AI backend running on http://localhost:' + PORT);
  console.log('Health:  http://localhost:' + PORT + '/api/health');
  console.log('Stream:  http://localhost:' + PORT + '/api/stream');
});
