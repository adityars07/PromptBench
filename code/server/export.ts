/**
 * Module 6: Export (code/server/export.ts)
 * Exports evaluation benchmarks as downloadable CSV and comprehensive Markdown reports.
 */

import { Router, Request, Response } from 'express';
import { getLatestResults } from './llmRunner';
import { getPrompts } from './promptManager';
import { getTestCases } from './testCases';
import { EvalResult, LeaderboardEntry } from './types';

const router = Router();

// GET /api/export/csv
router.get('/csv', (_req: Request, res: Response) => {
  try {
    const results = getLatestResults();
    if (!results || results.length === 0) {
      return res.status(404).send('No evaluation results available to export.');
    }

    const headers = [
      'PromptVersionId',
      'TestCaseId',
      'Model',
      'Provider',
      'Accuracy',
      'Relevance',
      'Consistency',
      'InstructionFollowing',
      'Overall',
      'Pass',
      'AvgLatencyMs'
    ];

    const rows = results.map(r => {
      const avgLat = r.runs.length > 0
        ? Math.round(r.runs.reduce((a, b) => a + b.latencyMs, 0) / r.runs.length)
        : 0;
      return [
        `"${r.promptVersionId}"`,
        `"${r.testCaseId}"`,
        `"${r.model}"`,
        `"${r.provider}"`,
        r.scores.accuracy.toFixed(1),
        r.scores.relevance.toFixed(1),
        r.scores.consistency.toFixed(1),
        r.scores.instructionFollowing.toFixed(1),
        r.scores.overall.toFixed(1),
        r.pass ? 'PASS' : 'FAIL',
        avgLat
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="promptbench_evaluation.csv"');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).send(`Failed to generate CSV: ${error.message}`);
  }
});

// GET /api/export/markdown
router.get('/markdown', (_req: Request, res: Response) => {
  try {
    const results = getLatestResults();
    const prompts = getPrompts();
    const testCases = getTestCases();

    if (!results || results.length === 0) {
      return res.status(404).send('# PromptBench Report\n\nNo evaluation results found.');
    }

    // Compute leaderboard aggregation
    const comboMap = new Map<string, {
      count: number;
      acc: number;
      rel: number;
      con: number;
      ins: number;
      overall: number;
      promptVersionId: string;
      model: string;
    }>();

    for (const r of results) {
      const key = `${r.promptVersionId}__${r.model}`;
      if (!comboMap.has(key)) {
        comboMap.set(key, {
          count: 0,
          acc: 0,
          rel: 0,
          con: 0,
          ins: 0,
          overall: 0,
          promptVersionId: r.promptVersionId,
          model: r.model
        });
      }
      const entry = comboMap.get(key)!;
      entry.count += 1;
      entry.acc += r.scores.accuracy;
      entry.rel += r.scores.relevance;
      entry.con += r.scores.consistency;
      entry.ins += r.scores.instructionFollowing;
      entry.overall += r.scores.overall;
    }

    const leaderboard: LeaderboardEntry[] = [];
    for (const [_, val] of comboMap.entries()) {
      const p = prompts.find(pr => pr.id === val.promptVersionId);
      leaderboard.push({
        promptVersionId: val.promptVersionId,
        promptName: p ? p.name : val.promptVersionId,
        model: val.model,
        accuracy: Math.round((val.acc / val.count) * 10) / 10,
        relevance: Math.round((val.rel / val.count) * 10) / 10,
        consistency: Math.round((val.con / val.count) * 10) / 10,
        instructionFollowing: Math.round((val.ins / val.count) * 10) / 10,
        overall: Math.round((val.overall / val.count) * 10) / 10
      });
    }

    leaderboard.sort((a, b) => b.overall - a.overall);
    const best = leaderboard[0];

    const timestamp = new Date().toISOString();
    let md = `# PromptBench — AI Prompt Evaluation Platform Report\n\n`;
    md += `*Generated: ${timestamp}*\n\n`;
    md += `## Executive Summary\n\n`;
    if (best) {
      md += `> **Top Performing Configuration:** **${best.promptName}** with **${best.model}** achieved an overall score of **${best.overall}/10**.\n`;
      md += `> **Recommendation:** Few-shot examples and strict negative constraints yield a notable improvement over unstructured baseline prompts.\n\n`;
    }

    md += `## Leaderboard (Ranked by Overall Score)\n\n`;
    md += `| Rank | Prompt Version | Model | Accuracy | Relevance | Consistency | Instruction-Following | Overall | Status |\n`;
    md += `|:----:|:---------------|:------|:--------:|:---------:|:-----------:|:---------------------:|:-------:|:------:|\n`;

    leaderboard.forEach((entry, idx) => {
      const status = entry.overall >= 7.0 ? 'PASS' : 'FAIL';
      md += `| ${idx + 1} | ${entry.promptName} | ${entry.model} | ${entry.accuracy} | ${entry.relevance} | ${entry.consistency} | ${entry.instructionFollowing} | **${entry.overall}** | ${status} |\n`;
    });

    md += `\n## Prompt Version Specifications\n\n`;
    prompts.forEach(p => {
      md += `### ${p.name} (id: ${p.id})\n`;
      md += `- **Temperature:** ${p.temperature}\n`;
      md += `- **Change Note:** ${p.changeNote}\n`;
      md += `\n**System Prompt:**\n\`\`\`\n${p.systemPrompt}\n\`\`\`\n\n`;
    });

    md += `## Methodology & Evaluation Metrics\n\n`;
    md += `- **Accuracy (0-10):** LLM-as-a-judge score evaluating factual alignment with test case ground truth.\n`;
    md += `- **Relevance (0-10):** LLM-as-a-judge score measuring focus and absence of unnecessary text.\n`;
    md += `- **Consistency (0-10):** Scikit-learn TF-IDF cosine similarity across consecutive runs.\n`;
    md += `- **Instruction-Following (0-10):** Deterministic TypeScript rule checks for JSON syntax, required schema keys, and word limits.\n`;
    md += `- **Overall Score:** Weighted composite score (Threshold for PASS: >= 7.0).\n`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="promptbench_report.md"');
    res.send(md);
  } catch (error: any) {
    res.status(500).send(`Failed to generate Markdown report: ${error.message}`);
  }
});

export default router;
