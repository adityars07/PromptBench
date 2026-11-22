/**
 * Module 2: Prompt Manager (code/server/promptManager.ts)
 * Manages prompt versions with systemPrompt, userTemplate, temperature, and change notes.
 * Automatically bootstraps versions v1, v2, and v3 from prompts/ directory.
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PromptVersion, getProjectRoot } from './types';

const router = Router();
const ROOT = getProjectRoot();
const DATA_DIR = path.join(ROOT, 'data');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');
const PROMPTS_DIR = path.join(ROOT, 'prompts');

function loadSeedPrompt(filename: string, fallback: string): string {
  try {
    const p = path.join(PROMPTS_DIR, filename);
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8').trim();
    }
  } catch (e) {
    console.warn(`Could not read ${filename}:`, e);
  }
  return fallback;
}

export function getPrompts(): PromptVersion[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(PROMPTS_FILE)) {
      const content = fs.readFileSync(PROMPTS_FILE, 'utf-8');
      return JSON.parse(content) as PromptVersion[];
    }

    // Initialize defaults from prompts/*.txt
    const v1Content = loadSeedPrompt('v1.txt', 'Summarise this email.');
    const v2Content = loadSeedPrompt('v2.txt', 'You are a customer support triage assistant. Summarise the email into JSON.');
    const v3Content = loadSeedPrompt('v3.txt', 'You are an expert customer support triage specialist.');

    const defaults: PromptVersion[] = [
      {
        id: 'v1',
        name: 'v1 - Bare Instruction',
        systemPrompt: 'You are a helpful assistant.',
        userTemplate: `${v1Content}\n\nEmail:\n{email_text}`,
        temperature: 0.7,
        changeNote: 'Baseline minimal instruction with no structure or JSON schema guidance.'
      },
      {
        id: 'v2',
        name: 'v2 - Structured with Role',
        systemPrompt: v2Content,
        userTemplate: 'Customer Email:\n{email_text}',
        temperature: 0.5,
        changeNote: 'Added support triage persona, explicit JSON format, and required keys.'
      },
      {
        id: 'v3',
        name: 'v3 - Few-Shot Expert',
        systemPrompt: v3Content,
        userTemplate: 'Customer Email:\n{email_text}',
        temperature: 0.2,
        changeNote: 'Strict JSON schema, urgency classification rubric, edge-case rules, and 2 few-shot examples.'
      }
    ];

    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
    return defaults;
  } catch (error) {
    console.error('[PromptManager] Error loading prompts:', error);
    return [];
  }
}

export function savePrompts(prompts: PromptVersion[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2), 'utf-8');
}

// GET all prompts
router.get('/', (_req: Request, res: Response) => {
  try {
    const prompts = getPrompts();
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve prompt versions' });
  }
});

// GET single prompt
router.get('/:id', (req: Request, res: Response) => {
  try {
    const prompts = getPrompts();
    const prompt = prompts.find(p => p.id === req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt version not found' });
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve prompt version' });
  }
});

// POST create prompt version
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, systemPrompt, userTemplate, temperature, changeNote } = req.body;
    if (!name || !userTemplate) {
      return res.status(400).json({ error: 'name and userTemplate are required' });
    }

    const prompts = getPrompts();
    const newPrompt: PromptVersion = {
      id: `v${prompts.length + 1}-${Date.now().toString().slice(-4)}`,
      name,
      systemPrompt: systemPrompt || 'You are a helpful assistant.',
      userTemplate,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      changeNote: changeNote || 'Iterative refinement.'
    };

    prompts.push(newPrompt);
    savePrompts(prompts);
    res.status(201).json(newPrompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prompt version' });
  }
});

// PUT update prompt version
router.put('/:id', (req: Request, res: Response) => {
  try {
    const prompts = getPrompts();
    const index = prompts.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Prompt version not found' });
    }

    const current = prompts[index];
    const updated: PromptVersion = {
      ...current,
      name: req.body.name !== undefined ? req.body.name : current.name,
      systemPrompt: req.body.systemPrompt !== undefined ? req.body.systemPrompt : current.systemPrompt,
      userTemplate: req.body.userTemplate !== undefined ? req.body.userTemplate : current.userTemplate,
      temperature: req.body.temperature !== undefined ? req.body.temperature : current.temperature,
      changeNote: req.body.changeNote !== undefined ? req.body.changeNote : current.changeNote
    };

    prompts[index] = updated;
    savePrompts(prompts);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prompt version' });
  }
});

// DELETE prompt version
router.delete('/:id', (req: Request, res: Response) => {
  try {
    let prompts = getPrompts();
    const initialLen = prompts.length;
    prompts = prompts.filter(p => p.id !== req.params.id);
    if (prompts.length === initialLen) {
      return res.status(404).json({ error: 'Prompt version not found' });
    }
    savePrompts(prompts);
    res.json({ success: true, message: 'Prompt version deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prompt version' });
  }
});

export default router;
