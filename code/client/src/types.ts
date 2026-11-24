/**
 * Data layer types for PromptBench frontend
 */

export interface TestCaseConstraints {
  maxWords?: number;
  validJson?: boolean;
  language?: string;
  requiredKeys?: string[];
}

export interface TestCase {
  id: string; // e.g. "T1", "T2", ...
  type: 'Normal' | 'Edge' | 'Invalid';
  input: string;
  expectedOutput: string;
  constraintsSummary?: string;
  constraints?: TestCaseConstraints;
}

export interface PromptVersion {
  id: string; // "v1", "v2", "v3", ...
  name: string; // "v1 · Bare instruction"
  title: string; // "v1", "v2", "v3"
  subtitle: string; // "Bare instruction", "Role, rubric and JSON format", "Few-shot with strict JSON"
  temperature: number; // e.g. 0.2, or 0.7
  tempLabel: string; // "temp default", "temp 0.2"
  changeNote: string; // "Starting point", "Scores were inconsistent", ...
  systemPrompt: string;
  userTemplate: string;
  examplesCount?: number;
}

export interface ScoreSet {
  accuracy: number;
  relevance: number;
  consistency: number;
  instruction: number;
  overall: number;
}

export interface RunResult {
  runIndex: number;
  response: string;
  latencyMs?: number;
}

export interface LeaderboardRow {
  rank: number;
  promptId: string; // "v3"
  promptName: string; // "v3"
  promptSubtitle?: string; // "Few-shot with strict JSON"
  model: string; // "Gemini 2.5 Flash", "Llama 3.3 70B"
  accuracy: number;
  relevance: number;
  consistency: number;
  instruction: number;
  overall: number;
  isTop?: boolean;
}

export interface PerTestResult {
  testId: string; // "T1"
  type: 'Normal' | 'Edge' | 'Invalid';
  input: string;
  expected: string;
  actual: string;
  accuracy: number;
  relevance: number;
  consistency: number;
  instruction: number;
  overall: number;
  pass: boolean;
}

export interface WeightSettings {
  accuracy: number; // 35
  relevance: number; // 25
  consistency: number; // 20
  instruction: number; // 20
}

export interface EvalProgressState {
  completedCalls: number;
  totalCalls: number;
  geminiCompleted: number;
  geminiTotal: number;
  llamaCompleted: number;
  llamaTotal: number;
  retries: number;
  isRunning: boolean;
  logs: Array<{
    id: string;
    text: string;
    status: 'done' | 'running' | 'queued';
  }>;
}
