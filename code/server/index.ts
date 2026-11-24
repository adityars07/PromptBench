/**
 * PromptBench Express Server Entry Point
 * Mounts REST APIs, serves the built React frontend, and communicates with the Python LLM service.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as path from 'path';
import * as dotenv from 'dotenv';

import testCasesRouter from './testCases';
import promptManagerRouter from './promptManager';
import llmRunnerRouter from './llmRunner';
import exportRouter from './export';
import { getProjectRoot } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7860;
const ROOT = getProjectRoot();
const CLIENT_DIST = path.join(ROOT, 'code/client/dist');
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

export function getPythonUrl(endpoint: string): string {
  const base = (process.env.PYTHON_SERVICE_URL || 'http://localhost:8001').trim();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return new URL(cleanEndpoint, normalizedBase).toString();
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/test-cases', testCasesRouter);
app.use('/api/prompts', promptManagerRouter);
app.use('/api/evaluate', llmRunnerRouter);
app.use('/api/export', exportRouter);

// Judge prompt inspect endpoint
app.get('/api/judge-prompt', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(getPythonUrl('judge-prompt'));
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch {}
  res.json({
    system_prompt: `You are an impartial, highly rigorous AI Benchmark Judge evaluating candidate LLM responses against benchmark ground truth and key criteria.\n\nEvaluate on two criteria (0.0 - 10.0):\n1. ACCURACY\n2. RELEVANCE\n\nRespond with strictly valid JSON:\n{"accuracy": number, "relevance": number, "reasoning": "string"}`
  });
});

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  let pythonHealth = 'disconnected';
  try {
    const pyRes = await fetch(getPythonUrl('health'));
    if (pyRes.ok) {
      const data = await pyRes.json();
      pythonHealth = data.status || 'connected';
    }
  } catch {}

  res.json({
    status: 'healthy',
    server: 'PromptBench Express API',
    port: PORT,
    pythonService: pythonHealth,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static assets if available
if (require('fs').existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.send(`
      <html>
        <head><title>PromptBench API</title></head>
        <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc;">
          <h1>PromptBench API Server is Running on port ${PORT}</h1>
          <p>Client build not found in <code>client/dist</code>. Run <code>npm run build</code> in <code>code/client</code>.</p>
          <p>Available endpoints: <code>/api/test-cases</code>, <code>/api/prompts</code>, <code>/api/evaluate/results</code>, <code>/api/health</code></p>
        </body>
      </html>
    `);
  });
}

// Global error handler - app must never crash
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ServerError] Uncaught exception:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`PromptBench Server is running on port ${PORT}`);
    console.log(`Targeting Python Service at ${PYTHON_URL}`);
    console.log(`===============================================`);
  });
}

export default app;
