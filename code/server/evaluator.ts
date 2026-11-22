/**
 * Module 4: Evaluator (TypeScript Component)
 * Computes Instruction-Following score using deterministic, rule-based criteria:
 * - Word count boundary verification
 * - JSON syntax correctness
 * - Presence of required schema keys
 * - Language verification heuristic
 * Scale: 0.0 - 10.0 (No LLM required)
 */

import { TestCaseConstraints } from './types';

export function computeInstructionFollowing(
  response: string,
  constraints?: TestCaseConstraints
): number {
  if (!response || !response.trim()) {
    return 0.0;
  }

  if (!constraints) {
    return 10.0;
  }

  const scores: number[] = [];

  // 1. JSON Validity Check (weight 4.0 out of 10)
  if (constraints.validJson) {
    scores.push(checkJsonValidity(response));
  }

  // 2. Required Keys Check (weight 3.0 out of 10)
  if (constraints.requiredKeys && constraints.requiredKeys.length > 0) {
    scores.push(checkRequiredKeys(response, constraints.requiredKeys));
  }

  // 3. Word Count Check (weight 2.0 out of 10)
  if (constraints.maxWords && constraints.maxWords > 0) {
    scores.push(checkWordCount(response, constraints.maxWords));
  }

  // 4. Language Check (weight 1.0 out of 10)
  if (constraints.language) {
    scores.push(checkLanguage(response, constraints.language));
  }

  if (scores.length === 0) {
    return 10.0;
  }

  const avg = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

function checkJsonValidity(text: string): number {
  const trimmed = text.trim();
  // Perfect direct JSON
  try {
    JSON.parse(trimmed);
    return 10.0;
  } catch {}

  // Check if embedded in code blocks or text
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      JSON.parse(jsonMatch[0]);
      return 7.5; // Valid JSON but included conversational wrapper
    } catch {}
  }

  return 0.0;
}

function checkRequiredKeys(text: string, requiredKeys: string[]): number {
  if (requiredKeys.length === 0) return 10.0;

  let parsed: Record<string, any> | null = null;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {}
    }
  }

  if (parsed && typeof parsed === 'object') {
    const presentKeys = Object.keys(parsed);
    const matched = requiredKeys.filter(k => presentKeys.includes(k));
    const ratio = matched.length / requiredKeys.length;
    return Math.round(ratio * 100) / 10;
  }

  // Fallback: check if key strings appear in text
  const matched = requiredKeys.filter(k => text.includes(`"${k}"`) || text.includes(`'${k}'`));
  const ratio = matched.length / requiredKeys.length;
  return Math.round(ratio * 60) / 10; // Capped at 6.0 if not valid JSON
}

function checkWordCount(text: string, maxWords: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words <= maxWords) {
    return 10.0;
  }
  const excess = words - maxWords;
  const penalty = Math.min(10.0, (excess / maxWords) * 10);
  return Math.max(0.0, Math.round((10.0 - penalty) * 10) / 10);
}

function checkLanguage(text: string, expectedLang: string): number {
  if (expectedLang.toLowerCase() === 'en') {
    // English heuristic: ratio of standard ASCII alphabetic characters
    const totalChars = text.replace(/\s+/g, '').length;
    if (totalChars === 0) return 5.0;
    const asciiChars = (text.match(/[A-Za-z0-9.,;:!?'"\{\}\[\]_-]/g) || []).length;
    const ratio = asciiChars / totalChars;
    return ratio >= 0.85 ? 10.0 : 4.0;
  }
  return 10.0;
}
