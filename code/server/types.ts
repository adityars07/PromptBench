/**
 * Shared Type Definitions for PromptBench Backend
 */

import * as fs from 'fs';
import * as path from 'path';

export function getProjectRoot(): string {
  let cur = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(cur, 'test-data')) || fs.existsSync(path.join(cur, 'prompts'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  cur = __dirname;
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(cur, 'test-data')) || fs.existsSync(path.join(cur, 'prompts'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return path.resolve(__dirname, '../../..');
}

export interface TestCaseConstraints {
  maxWords?: number;
  validJson?: boolean;
  language?: string;
  requiredKeys?: string[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput?: string;
  keyPoints?: string[];
  type: 'Normal' | 'Edge' | 'Invalid';
  constraints?: TestCaseConstraints;
}

export interface PromptVersion {
  id: string;
  name: string;
  systemPrompt: string;
  userTemplate: string;
  temperature: number;
  changeNote: string;
}

export interface RunResult {
  runIndex: number;
  response: string;
  latencyMs: number;
}

export interface Scores {
  accuracy: number;
  relevance: number;
  consistency: number;
  instructionFollowing: number;
  overall: number;
}

export interface EvalResult {
  promptVersionId: string;
  testCaseId: string;
  model: string;
  provider: string;
  runs: RunResult[];
  scores: Scores;
  pass: boolean;
}

export interface EvalProgress {
  total: number;
  completed: number;
  currentTask: string;
  status: 'idle' | 'running' | 'done' | 'error';
  error?: string;
}

export interface WeightConfig {
  accuracy: number;
  relevance: number;
  consistency: number;
  instructionFollowing: number;
}

export interface LeaderboardEntry {
  promptVersionId: string;
  promptName: string;
  model: string;
  accuracy: number;
  relevance: number;
  consistency: number;
  instructionFollowing: number;
  overall: number;
}
