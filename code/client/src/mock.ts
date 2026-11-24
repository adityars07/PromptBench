/**
 * Mock data for PromptBench matching design specifications and screenshots exactly.
 */

import {
  TestCase,
  PromptVersion,
  LeaderboardRow,
  PerTestResult,
  EvalProgressState
} from './types';

export const MOCK_TEST_CASES: TestCase[] = [
  {
    id: 'T1',
    type: 'Normal',
    input: 'Refund request for a late parcel',
    expectedOutput: 'Issue: late delivery. Urgency: medium. Action: refund or reship.',
    constraintsSummary: 'Valid JSON · 3 keys',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T2',
    type: 'Normal',
    input: 'Password reset link not arriving',
    expectedOutput: 'Issue: reset email missing. Urgency: high. Action: resend and check spam.',
    constraintsSummary: 'Valid JSON · 3 keys',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T3',
    type: 'Normal',
    input: 'Question about invoice date',
    expectedOutput: 'Issue: invoice query. Urgency: low. Action: send invoice copy.',
    constraintsSummary: 'Valid JSON · 3 keys',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T4',
    type: 'Normal',
    input: 'Wireless headphones power button stuck after 1 week of normal use',
    expectedOutput: 'Issue: defective hardware. Urgency: medium. Action: initiate replacement RMA.',
    constraintsSummary: 'Valid JSON · 3 keys',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T5',
    type: 'Normal',
    input: 'Cannot log in to admin portal following new 2FA setup, locked out',
    expectedOutput: 'Issue: admin locked out via 2FA. Urgency: high. Action: verify identity and reset 2FA.',
    constraintsSummary: 'Valid JSON · 3 keys',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T6',
    type: 'Normal',
    input: 'Customer inquiring about pausing annual subscription during sabbatical',
    expectedOutput: 'Issue: subscription pause inquiry. Urgency: low. Action: provide pause and cancel options.',
    constraintsSummary: 'Valid JSON · 3 keys',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T7',
    type: 'Edge',
    input: 'Email written in Hinglish',
    expectedOutput: 'Summary in English, same JSON keys.',
    constraintsSummary: 'Valid JSON · English only',
    constraints: { validJson: true, language: 'en', requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T8',
    type: 'Edge',
    input: 'Very long email with several issues',
    expectedOutput: 'Picks the main issue, keeps the summary short.',
    constraintsSummary: 'Valid JSON · max 60 words',
    constraints: { validJson: true, maxWords: 60, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T9',
    type: 'Invalid',
    input: 'Body is only "idk"',
    expectedOutput: 'Asks for more detail instead of guessing.',
    constraintsSummary: 'Valid JSON · urgency low',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T10',
    type: 'Edge',
    input: 'Dramatic panic wording but only asking how to change dashboard background color',
    expectedOutput: 'Issue: UI customization question. Urgency: low despite dramatic tone. Action: send documentation.',
    constraintsSummary: 'Valid JSON · 3 keys',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T11',
    type: 'Edge',
    input: 'Overlapping billing dispute with complimentary feature enhancement suggestions',
    expectedOutput: 'Issue: billing charge dispute. Urgency: high. Action: audit payment ledger.',
    constraintsSummary: 'Valid JSON · max 50 words',
    constraints: { validJson: true, maxWords: 50, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  },
  {
    id: 'T12',
    type: 'Invalid',
    input: '   ',
    expectedOutput: 'Issue: missing email content. Urgency: low. Action: prompt sender for details.',
    constraintsSummary: 'Valid JSON · urgency low',
    constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
  }
];

export const MOCK_PROMPTS: PromptVersion[] = [
  {
    id: 'v1',
    name: 'v1 · Bare instruction',
    title: 'v1',
    subtitle: 'Bare instruction',
    temperature: 0.7,
    tempLabel: 'temp default',
    changeNote: 'Starting point',
    systemPrompt: 'You are a helpful assistant.',
    userTemplate: 'Summarise this email into JSON.\n\nEmail:\n{email}',
    examplesCount: 0
  },
  {
    id: 'v2',
    name: 'v2 · Role, rubric and JSON format',
    title: 'v2',
    subtitle: 'Role, rubric and JSON format',
    temperature: 0.7,
    tempLabel: 'temp default',
    changeNote: 'Scores were inconsistent',
    systemPrompt:
      'You are a customer support triage assistant.\nReturn only valid JSON with the keys: issue, urgency (low, medium or high) and suggested_action.\nDo not add any text outside the JSON.',
    userTemplate: 'Summarise the email below into the JSON format.\n\nEmail:\n{email}',
    examplesCount: 0
  },
  {
    id: 'v3',
    name: 'v3 · Few-shot with strict JSON',
    title: 'v3',
    subtitle: 'Few-shot with strict JSON',
    temperature: 0.2,
    tempLabel: 'temp 0.2',
    changeNote: 'Added 2 graded examples and set temperature to 0.2, because the JSON still broke in v2.',
    systemPrompt:
      'You are a customer support triage assistant.\nReturn only valid JSON with the keys: issue, urgency (low, medium or high) and suggested_action.\nDo not add any text outside the JSON.',
    userTemplate: 'Summarise the email below into the JSON format.\n\nEmail:\n{email}',
    examplesCount: 2
  }
];

export const MOCK_LEADERBOARD: LeaderboardRow[] = [
  {
    rank: 1,
    promptId: 'v3',
    promptName: 'v3',
    promptSubtitle: 'Few-shot with strict JSON',
    model: 'Gemini 2.5 Flash',
    accuracy: 8.8,
    relevance: 8.9,
    consistency: 8.4,
    instruction: 8.3,
    overall: 8.6,
    isTop: true
  },
  {
    rank: 2,
    promptId: 'v3',
    promptName: 'v3',
    promptSubtitle: 'Few-shot with strict JSON',
    model: 'Llama 3.3 70B',
    accuracy: 8.1,
    relevance: 8.4,
    consistency: 8.0,
    instruction: 7.9,
    overall: 8.1,
    isTop: false
  },
  {
    rank: 3,
    promptId: 'v2',
    promptName: 'v2',
    promptSubtitle: 'Role, rubric and JSON format',
    model: 'Gemini 2.5 Flash',
    accuracy: 7.2,
    relevance: 7.6,
    consistency: 6.5,
    instruction: 7.4,
    overall: 7.2,
    isTop: false
  },
  {
    rank: 4,
    promptId: 'v2',
    promptName: 'v2',
    promptSubtitle: 'Role, rubric and JSON format',
    model: 'Llama 3.3 70B',
    accuracy: 6.8,
    relevance: 7.1,
    consistency: 6.1,
    instruction: 6.9,
    overall: 6.8,
    isTop: false
  },
  {
    rank: 5,
    promptId: 'v1',
    promptName: 'v1',
    promptSubtitle: 'Bare instruction',
    model: 'Gemini 2.5 Flash',
    accuracy: 5.1,
    relevance: 6.0,
    consistency: 4.2,
    instruction: 3.5,
    overall: 4.8,
    isTop: false
  },
  {
    rank: 6,
    promptId: 'v1',
    promptName: 'v1',
    promptSubtitle: 'Bare instruction',
    model: 'Llama 3.3 70B',
    accuracy: 4.7,
    relevance: 5.8,
    consistency: 3.9,
    instruction: 3.2,
    overall: 4.5,
    isTop: false
  }
];

export const MOCK_DRILL_DOWN: PerTestResult[] = [
  {
    testId: 'T1',
    type: 'Normal',
    input: 'Refund request for a late parcel',
    expected: 'Issue: late delivery. Urgency: medium. Action: refund or reship.',
    actual: '{"issue": "Late parcel delivery", "urgency": "medium", "suggested_action": "Process refund or expedite reshipment"}',
    accuracy: 9.2,
    relevance: 9.4,
    consistency: 9.0,
    instruction: 10.0,
    overall: 9.4,
    pass: true
  },
  {
    testId: 'T2',
    type: 'Normal',
    input: 'Password reset link not arriving',
    expected: 'Issue: reset email missing. Urgency: high. Action: resend and check spam.',
    actual: '{"issue": "Password reset email not received", "urgency": "high", "suggested_action": "Resend reset link and verify spam folder"}',
    accuracy: 9.0,
    relevance: 9.1,
    consistency: 8.7,
    instruction: 10.0,
    overall: 9.2,
    pass: true
  },
  {
    testId: 'T7',
    type: 'Edge',
    input: 'Email written in Hinglish',
    expected: 'Summary in English, same JSON keys.',
    actual: '{"issue": "Account me login problem ho rahi hai", "urgency": "medium", "suggested_action": "Contact user in Hindi"}',
    accuracy: 6.5,
    relevance: 7.0,
    consistency: 6.2,
    instruction: 6.0,
    overall: 6.4,
    pass: false
  },
  {
    testId: 'T9',
    type: 'Invalid',
    input: 'Body is only "idk"',
    expected: 'Asks for more detail instead of guessing.',
    actual: '{"issue": "User wrote idk", "urgency": "low", "suggested_action": "Guessing user has questions"}',
    accuracy: 5.8,
    relevance: 6.2,
    consistency: 7.0,
    instruction: 5.0,
    overall: 6.0,
    pass: false
  }
];

export const MOCK_PROGRESS: EvalProgressState = {
  completedCalls: 134,
  totalCalls: 216,
  geminiCompleted: 78,
  geminiTotal: 108,
  llamaCompleted: 56,
  llamaTotal: 108,
  retries: 2,
  isRunning: false,
  logs: [
    { id: '1', text: 'v3 · T9 · Gemini · run 2 of 3 · done', status: 'done' },
    { id: '2', text: 'v3 · T9 · Gemini · run 3 of 3 · running', status: 'running' },
    { id: '3', text: 'v3 · T10 · Llama · run 1 of 3 · queued', status: 'queued' }
  ]
};

export const JUDGE_PROMPT_TEXT = `Compare the OUTPUT with the EXPECTED key points.
Score accuracy and relevance from 0 to 10.
Reply with JSON only: {"accuracy": n, "relevance": n}`;
