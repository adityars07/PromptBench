/**
 * Module 1: Test Case Manager (code/server/testCases.ts)
 * Handles CRUD operations for test cases and persists them to JSON storage.
 * Preloaded with 12 diverse test cases (6 Normal, 4 Edge, 2 Invalid).
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { TestCase, getProjectRoot } from './types';

const router = Router();
const ROOT = getProjectRoot();
const DATA_DIR = path.join(ROOT, 'data');
const TEST_CASES_FILE = path.join(DATA_DIR, 'test_cases.json');
const SEED_FILE = path.join(ROOT, 'test-data', 'test_cases.json');

/**
 * Ensures data directory exists and returns in-memory test cases.
 */
export function getTestCases(): TestCase[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(TEST_CASES_FILE)) {
      const content = fs.readFileSync(TEST_CASES_FILE, 'utf-8');
      return JSON.parse(content) as TestCase[];
    }
    if (fs.existsSync(SEED_FILE)) {
      const seedContent = fs.readFileSync(SEED_FILE, 'utf-8');
      fs.writeFileSync(TEST_CASES_FILE, seedContent, 'utf-8');
      return JSON.parse(seedContent) as TestCase[];
    }
  } catch (error) {
    console.error('[TestCases] Error loading test cases:', error);
  }
  return [];
}

/**
 * Saves test cases list to JSON file.
 */
export function saveTestCases(cases: TestCase[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(TEST_CASES_FILE, JSON.stringify(cases, null, 2), 'utf-8');
}

// GET all test cases
router.get('/', (_req: Request, res: Response) => {
  try {
    const cases = getTestCases();
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve test cases' });
  }
});

// GET single test case
router.get('/:id', (req: Request, res: Response) => {
  try {
    const cases = getTestCases();
    const item = cases.find(c => c.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve test case' });
  }
});

// POST create test case
router.post('/', (req: Request, res: Response) => {
  try {
    const { input, expectedOutput, keyPoints, type, constraints } = req.body;
    if (!input || !type) {
      return res.status(400).json({ error: 'input and type are required' });
    }

    const cases = getTestCases();
    const newCase: TestCase = {
      id: `tc-${Date.now().toString().slice(-6)}`,
      input,
      expectedOutput: expectedOutput || '',
      keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
      type: ['Normal', 'Edge', 'Invalid'].includes(type) ? type : 'Normal',
      constraints: constraints || { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
    };

    cases.push(newCase);
    saveTestCases(cases);
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test case' });
  }
});

// PUT update test case
router.put('/:id', (req: Request, res: Response) => {
  try {
    const cases = getTestCases();
    const index = cases.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Test case not found' });
    }

    const current = cases[index];
    const updated: TestCase = {
      ...current,
      input: req.body.input !== undefined ? req.body.input : current.input,
      expectedOutput: req.body.expectedOutput !== undefined ? req.body.expectedOutput : current.expectedOutput,
      keyPoints: req.body.keyPoints !== undefined ? req.body.keyPoints : current.keyPoints,
      type: req.body.type !== undefined ? req.body.type : current.type,
      constraints: req.body.constraints !== undefined ? req.body.constraints : current.constraints
    };

    cases[index] = updated;
    saveTestCases(cases);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update test case' });
  }
});

// DELETE test case
router.delete('/:id', (req: Request, res: Response) => {
  try {
    let cases = getTestCases();
    const initialLen = cases.length;
    cases = cases.filter(c => c.id !== req.params.id);
    if (cases.length === initialLen) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    saveTestCases(cases);
    res.json({ success: true, message: 'Test case deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete test case' });
  }
});

export default router;
