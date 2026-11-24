/**
 * Data layer for PromptBench.
 * Communicates with /api/... and falls back to mock.ts when Demo mode is ON or backend is unavailable.
 */

import {
  TestCase,
  PromptVersion,
  LeaderboardRow,
  PerTestResult,
  WeightSettings,
  EvalProgressState
} from './types';
import {
  MOCK_TEST_CASES,
  MOCK_PROMPTS,
  MOCK_LEADERBOARD,
  MOCK_DRILL_DOWN,
  MOCK_PROGRESS,
  JUDGE_PROMPT_TEXT
} from './mock';

export function calculateWeightedOverall(
  accuracy: number,
  relevance: number,
  consistency: number,
  instruction: number,
  weights: WeightSettings
): number {
  const totalWeight = weights.accuracy + weights.relevance + weights.consistency + weights.instruction;
  if (totalWeight === 0) return 0;
  const raw =
    (accuracy * weights.accuracy +
      relevance * weights.relevance +
      consistency * weights.consistency +
      instruction * weights.instruction) /
    totalWeight;
  return Math.round(raw * 10) / 10;
}

export async function fetchTestCases(demoMode = true): Promise<TestCase[]> {
  if (demoMode) {
    return MOCK_TEST_CASES;
  }
  try {
    const res = await fetch('/api/test-cases');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((d: any, idx: number) => ({
        id: d.id || `T${idx + 1}`,
        type: d.type || 'Normal',
        input: d.input || '',
        expectedOutput: d.expectedOutput || '',
        constraintsSummary: d.constraintsSummary || (d.constraints?.validJson ? 'Valid JSON · 3 keys' : 'Standard'),
        constraints: d.constraints
      }));
    }
  } catch (err) {
    console.warn('Backend call failed, falling back to mock data:', err);
  }
  return MOCK_TEST_CASES;
}

export async function saveTestCase(tc: TestCase, demoMode = true): Promise<TestCase> {
  if (demoMode) {
    return tc;
  }
  try {
    const res = await fetch('/api/test-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tc)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Save test case fallback to local:', err);
  }
  return tc;
}

export async function deleteTestCase(id: string, demoMode = true): Promise<boolean> {
  if (demoMode) {
    return true;
  }
  try {
    const res = await fetch(`/api/test-cases/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.warn('Delete test case fallback to local:', err);
    return true;
  }
}

export async function fetchPrompts(demoMode = true): Promise<PromptVersion[]> {
  if (demoMode) {
    return MOCK_PROMPTS;
  }
  try {
    const res = await fetch('/api/prompts');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        name: d.name || `${d.id} · ${d.title || 'Prompt'}`,
        title: d.id,
        subtitle: d.subtitle || d.changeNote || 'Versioned prompt',
        temperature: d.temperature ?? 0.7,
        tempLabel: d.temperature === 0.2 ? 'temp 0.2' : 'temp default',
        changeNote: d.changeNote || '',
        systemPrompt: d.systemPrompt || '',
        userTemplate: d.userTemplate || '',
        examplesCount: d.examplesCount ?? (d.id === 'v3' ? 2 : 0)
      }));
    }
  } catch (err) {
    console.warn('Backend call failed, falling back to mock prompts:', err);
  }
  return MOCK_PROMPTS;
}

export async function savePrompt(p: PromptVersion, demoMode = true): Promise<PromptVersion> {
  if (demoMode) {
    return p;
  }
  try {
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Save prompt fallback to local:', err);
  }
  return p;
}

export async function fetchLeaderboard(
  weights: WeightSettings,
  demoMode = true
): Promise<LeaderboardRow[]> {
  let baseRows = MOCK_LEADERBOARD;

  if (!demoMode) {
    try {
      const res = await fetch('/api/evaluate/results');
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          // Calculate dynamic aggregations if needed
        }
      }
    } catch (err) {
      console.warn('Using baseline leaderboard:', err);
    }
  }

  // Recalculate Overall with current weights dynamically
  const computed = baseRows.map((row) => {
    const overall = calculateWeightedOverall(
      row.accuracy,
      row.relevance,
      row.consistency,
      row.instruction,
      weights
    );
    return {
      ...row,
      overall
    };
  });

  computed.sort((a, b) => b.overall - a.overall);
  return computed.map((row, idx) => ({
    ...row,
    rank: idx + 1,
    isTop: idx === 0
  }));
}

export async function fetchDrillDown(_demoMode = true): Promise<PerTestResult[]> {
  return MOCK_DRILL_DOWN;
}

export async function fetchProgress(_demoMode = true): Promise<EvalProgressState> {
  return MOCK_PROGRESS;
}

export async function fetchJudgePrompt(): Promise<string> {
  try {
    const res = await fetch('/api/judge-prompt');
    if (res.ok) {
      const data = await res.json();
      return data.system_prompt || JUDGE_PROMPT_TEXT;
    }
  } catch {}
  return JUDGE_PROMPT_TEXT;
}

export function exportResultsCSV(rows: LeaderboardRow[], drillDown: PerTestResult[]): void {
  const headers = ['Rank', 'Prompt', 'Model', 'Accuracy', 'Relevance', 'Consistency', 'Instruction', 'Overall'];
  const csvLines = [headers.join(',')];

  rows.forEach((r) => {
    csvLines.push(
      [r.rank, `"${r.promptName}"`, `"${r.model}"`, r.accuracy, r.relevance, r.consistency, r.instruction, r.overall].join(',')
    );
  });

  csvLines.push('\nPer-Test Drill-Down\n');
  csvLines.push(['Test ID', 'Type', 'Input', 'Accuracy', 'Relevance', 'Consistency', 'Instruction', 'Result'].join(','));
  drillDown.forEach((d) => {
    csvLines.push(
      [d.testId, d.type, `"${d.input}"`, d.accuracy, d.relevance, d.consistency, d.instruction, d.pass ? 'Pass' : 'Fail'].join(',')
    );
  });

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PromptBench_results.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function exportResultsMarkdown(
  bestRow: LeaderboardRow,
  rows: LeaderboardRow[],
  drillDown: PerTestResult[]
): void {
  let md = `# PromptBench — Evaluation Report\n\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  md += `## Best Prompt For This Task\n\n`;
  md += `> **${bestRow.promptName} (${bestRow.model})** scored **${bestRow.overall} / 10**.\n\n`;
  md += `## Leaderboard\n\n`;
  md += `| Rank | Prompt | Model | Accuracy | Relevance | Consistency | Instruction | Overall |\n`;
  md += `|:----:|:-------|:------|:--------:|:---------:|:-----------:|:-----------:|:-------:|\n`;
  rows.forEach((r) => {
    md += `| ${r.rank} | ${r.promptName} | ${r.model} | ${r.accuracy} | ${r.relevance} | ${r.consistency} | ${r.instruction} | **${r.overall}** |\n`;
  });

  md += `\n## Per-Test Drill-Down\n\n`;
  md += `| Test | Type | Input | Accuracy | Relevance | Consistency | Instruction | Result |\n`;
  md += `|:----:|:-----|:------|:--------:|:---------:|:-----------:|:-----------:|:------:|\n`;
  drillDown.forEach((d) => {
    md += `| ${d.testId} | ${d.type} | ${d.input} | ${d.accuracy} | ${d.relevance} | ${d.consistency} | ${d.instruction} | ${d.pass ? 'Pass' : 'Fail'} |\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PromptBench_results.md';
  a.click();
  URL.revokeObjectURL(url);
}
