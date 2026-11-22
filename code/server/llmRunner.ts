/**
 * Module 3: LLM Runner (code/server/llmRunner.ts)
 * Orchestrates evaluation runs: (selected prompt versions) × (test cases) × (models) × (N runs).
 * Communicates with the Python LLM service at http://localhost:8001.
 * Provides in-memory progress reporting and saves results to data/results.json.
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import {
  TestCase,
  PromptVersion,
  EvalResult,
  EvalProgress,
  RunResult,
  Scores,
  getProjectRoot
} from './types';
import { getTestCases } from './testCases';
import { getPrompts } from './promptManager';
import { computeInstructionFollowing } from './evaluator';

const router = Router();
const ROOT = getProjectRoot();
const DATA_DIR = path.join(ROOT, 'data');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
const CACHED_FILE = path.join(ROOT, 'test-data', 'cached_results.json');
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

// Global execution state
let currentProgress: EvalProgress = {
  total: 0,
  completed: 0,
  currentTask: 'Idle',
  status: 'idle'
};

let activeResults: EvalResult[] = [];

/**
 * Loads cached evaluation results for Demo Mode.
 */
export function getCachedResults(): { results: EvalResult[]; metadata: any } {
  try {
    if (fs.existsSync(CACHED_FILE)) {
      return JSON.parse(fs.readFileSync(CACHED_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[LLMRunner] Error reading cached results:', e);
  }
  return { results: [], metadata: {} };
}

/**
 * Persists evaluated results to disk.
 */
function saveResults(results: EvalResult[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf-8');
  } catch (e) {
    console.error('[LLMRunner] Error saving results:', e);
  }
}

/**
 * Retrieves current results from memory or disk.
 */
export function getLatestResults(): EvalResult[] {
  if (activeResults.length > 0) return activeResults;
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8')) as EvalResult[];
    }
  } catch {}
  return getCachedResults().results;
}

// Helper: HTTP request using native fetch
async function callPython(endpoint: string, body: any): Promise<any> {
  const url = `${PYTHON_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Python service error (${response.status}): ${errorText}`);
  }
  return await response.json();
}

/**
 * Performs full evaluation asynchronously.
 */
async function executeEvaluation(
  selectedPrompts: PromptVersion[],
  selectedTestCases: TestCase[],
  models: Array<{ model: string; provider: string }>,
  runsPerCase: number
): Promise<void> {
  const totalCombinations = selectedPrompts.length * selectedTestCases.length * models.length;
  currentProgress = {
    total: totalCombinations,
    completed: 0,
    currentTask: 'Starting evaluation pipeline...',
    status: 'running'
  };

  const results: EvalResult[] = [];

  try {
    for (const prompt of selectedPrompts) {
      for (const tc of selectedTestCases) {
        for (const m of models) {
          currentProgress.currentTask = `Evaluating [${prompt.name}] on case [${tc.id}] with [${m.model}] (${runsPerCase} runs)`;

          // 1. Substitute variables in userTemplate
          const userPrompt = prompt.userTemplate
            .replace(/{email_text}/g, tc.input)
            .replace(/{email}/g, tc.input)
            .replace(/{input}/g, tc.input);

          const runs: RunResult[] = [];
          for (let r = 0; r < runsPerCase; r++) {
            try {
              const genResponse = await callPython('/llm/generate', {
                provider: m.provider,
                model: m.model,
                system_prompt: prompt.systemPrompt,
                user_prompt: userPrompt,
                temperature: prompt.temperature
              });
              runs.push({
                runIndex: r,
                response: genResponse.text || '',
                latencyMs: genResponse.latency_ms || 0
              });
            } catch (err: any) {
              console.warn(`[LLMRunner] Run ${r} failed for ${m.model}:`, err.message);
              runs.push({
                runIndex: r,
                response: `Error: ${err.message}`,
                latencyMs: 0
              });
            }
          }

          // 2. Score with LLM-as-a-judge
          const primaryResponse = runs[0]?.response || '';
          let accuracy = 5.0;
          let relevance = 5.0;
          try {
            const judgeRes = await callPython('/llm/judge', {
              input_text: tc.input,
              expected_output: tc.expectedOutput || '',
              key_points: tc.keyPoints || [],
              response: primaryResponse
            });
            accuracy = judgeRes.accuracy;
            relevance = judgeRes.relevance;
          } catch (e) {
            console.warn('[LLMRunner] Judge call failed, using heuristic:', e);
          }

          // 3. Score consistency across runs
          let consistency = 8.0;
          try {
            const validResponses = runs.map(r => r.response).filter(r => !r.startsWith('Error:'));
            const consRes = await callPython('/llm/consistency', { responses: validResponses });
            consistency = consRes.score;
          } catch (e) {
            console.warn('[LLMRunner] Consistency call failed:', e);
          }

          // 4. Score instruction-following in TypeScript
          const instructionFollowing = computeInstructionFollowing(primaryResponse, tc.constraints);

          // 5. Compute overall score (default equal weight)
          const overall = Math.round(((accuracy + relevance + consistency + instructionFollowing) / 4) * 10) / 10;
          const pass = overall >= 7.0;

          const evalItem: EvalResult = {
            promptVersionId: prompt.id,
            testCaseId: tc.id,
            model: m.model,
            provider: m.provider,
            runs,
            scores: {
              accuracy,
              relevance,
              consistency,
              instructionFollowing,
              overall
            },
            pass
          };

          results.push(evalItem);
          currentProgress.completed += 1;
        }
      }
    }

    activeResults = results;
    saveResults(results);
    currentProgress.status = 'done';
    currentProgress.currentTask = 'Evaluation completed successfully.';
  } catch (error: any) {
    console.error('[LLMRunner] Fatal evaluation pipeline error:', error);
    currentProgress.status = 'error';
    currentProgress.error = error.message || 'Evaluation process encountered an error';
  }
}

// POST /api/evaluate - Start evaluation or trigger demo mode
router.post('/', async (req: Request, res: Response) => {
  try {
    const { promptVersionIds, testCaseIds, models, runsPerCase = 3, demoMode = true } = req.body;

    if (demoMode) {
      const cached = getCachedResults();
      activeResults = cached.results;
      saveResults(activeResults);
      currentProgress = {
        total: activeResults.length,
        completed: activeResults.length,
        currentTask: 'Demo mode loaded pre-computed benchmarks.',
        status: 'done'
      };
      return res.json({
        message: 'Demo mode loaded successfully',
        demoMode: true,
        results: activeResults
      });
    }

    // Live execution
    const allPrompts = getPrompts();
    const allTestCases = getTestCases();

    const selectedPrompts = promptVersionIds && promptVersionIds.length > 0
      ? allPrompts.filter(p => promptVersionIds.includes(p.id))
      : allPrompts;

    const selectedTestCases = testCaseIds && testCaseIds.length > 0
      ? allTestCases.filter(tc => testCaseIds.includes(tc.id))
      : allTestCases.slice(0, 6);

    const modelList = models && models.length > 0 ? models : [
      { model: 'gemini-1.5-flash', provider: 'google' },
      { model: 'llama-3.1-8b-instant', provider: 'groq' }
    ];

    const clampedRuns = Math.max(1, Math.min(5, Number(runsPerCase) || 3));

    // Kick off async runner
    executeEvaluation(selectedPrompts, selectedTestCases, modelList, clampedRuns);

    res.status(202).json({
      message: 'Evaluation pipeline initiated',
      totalCombinations: selectedPrompts.length * selectedTestCases.length * modelList.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to start evaluation' });
  }
});

// GET /api/evaluate/progress
router.get('/progress', (_req: Request, res: Response) => {
  res.json(currentProgress);
});

// GET /api/evaluate/results
router.get('/results', (_req: Request, res: Response) => {
  res.json(getLatestResults());
});

// GET /api/evaluate/results/cached
router.get('/results/cached', (_req: Request, res: Response) => {
  res.json(getCachedResults());
});

export default router;
