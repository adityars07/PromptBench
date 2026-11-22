import { TestCase, PromptVersion, EvalResult, EvalProgress } from './types';

export async function fetchTestCases(): Promise<TestCase[]> {
  try {
    const res = await fetch('/api/test-cases');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.error('Failed to load test cases:', err);
    return [];
  }
}

export async function createTestCase(tc: Partial<TestCase>): Promise<TestCase> {
  const res = await fetch('/api/test-cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tc)
  });
  if (!res.ok) throw new Error('Failed to create test case');
  return await res.json();
}

export async function deleteTestCase(id: string): Promise<boolean> {
  const res = await fetch(`/api/test-cases/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchPrompts(): Promise<PromptVersion[]> {
  try {
    const res = await fetch('/api/prompts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.error('Failed to load prompts:', err);
    return [];
  }
}

export async function createPrompt(p: Partial<PromptVersion>): Promise<PromptVersion> {
  const res = await fetch('/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p)
  });
  if (!res.ok) throw new Error('Failed to create prompt');
  return await res.json();
}

export async function deletePrompt(id: string): Promise<boolean> {
  const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function startEvaluation(config: {
  promptVersionIds?: string[];
  testCaseIds?: string[];
  models?: Array<{ model: string; provider: string }>;
  runsPerCase?: number;
  demoMode?: boolean;
}): Promise<any> {
  const res = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to start evaluation');
  return await res.json();
}

export async function fetchProgress(): Promise<EvalProgress> {
  const res = await fetch('/api/evaluate/progress');
  if (!res.ok) throw new Error('Failed to fetch progress');
  return await res.json();
}

export async function fetchResults(): Promise<EvalResult[]> {
  const res = await fetch('/api/evaluate/results');
  if (!res.ok) throw new Error('Failed to fetch results');
  return await res.json();
}

export async function fetchCachedResults(): Promise<{ results: EvalResult[]; metadata: any }> {
  const res = await fetch('/api/evaluate/results/cached');
  if (!res.ok) throw new Error('Failed to fetch cached results');
  return await res.json();
}

export async function fetchJudgePrompt(): Promise<string> {
  try {
    const res = await fetch('/api/judge-prompt');
    const data = await res.json();
    return data.system_prompt || '';
  } catch {
    return 'Failed to load judge prompt.';
  }
}
