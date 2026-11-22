import React, { useState, useEffect } from 'react';
import { PromptVersion, TestCase, EvalProgress } from '../types';
import { startEvaluation, fetchProgress } from '../api';

interface RunEvaluationProps {
  prompts: PromptVersion[];
  testCases: TestCase[];
  selectedModels: string[];
  runsPerCase: number;
  demoMode: boolean;
  onEvaluationComplete: () => void;
}

export const RunEvaluation: React.FC<RunEvaluationProps> = ({
  prompts,
  testCases,
  selectedModels,
  runsPerCase,
  demoMode,
  onEvaluationComplete
}) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<EvalProgress | null>(null);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>(prompts.map(p => p.id));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Poll progress when running
  useEffect(() => {
    let interval: any = null;
    if (running) {
      interval = setInterval(async () => {
        try {
          const prog = await fetchProgress();
          setProgress(prog);
          if (prog.status === 'done') {
            setRunning(false);
            clearInterval(interval);
            onEvaluationComplete();
          } else if (prog.status === 'error') {
            setRunning(false);
            setErrorMsg(prog.error || 'Evaluation failed.');
            clearInterval(interval);
          }
        } catch (e: any) {
          console.error(e);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [running, onEvaluationComplete]);

  const handleStart = async () => {
    setErrorMsg(null);
    setRunning(true);
    try {
      const models = selectedModels.map(m => ({
        model: m,
        provider: m.includes('gemini') ? 'google' : 'groq'
      }));

      await startEvaluation({
        promptVersionIds: selectedPromptIds,
        testCaseIds: testCases.slice(0, 6).map(tc => tc.id),
        models,
        runsPerCase,
        demoMode
      });

      if (demoMode) {
        // Immediate finish for demo mode
        setTimeout(() => {
          setRunning(false);
          onEvaluationComplete();
        }, 800);
      }
    } catch (e: any) {
      setRunning(false);
      setErrorMsg(e.message || 'Failed to trigger evaluation pipeline');
    }
  };

  const togglePromptId = (id: string) => {
    if (selectedPromptIds.includes(id)) {
      if (selectedPromptIds.length > 1) setSelectedPromptIds(selectedPromptIds.filter(x => x !== id));
    } else {
      setSelectedPromptIds([...selectedPromptIds, id]);
    }
  };

  const combinations = selectedPromptIds.length * Math.min(testCases.length, 6) * selectedModels.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '850px' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Execute Prompt Benchmark Pipeline
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Runs matrix evaluation across selected prompt versions, test cases, and target models.
        </p>

        {demoMode && (
          <div style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: 'var(--accent-cyan)'
          }}>
            ⚡ <strong>Demo Mode is ACTIVE.</strong> Evaluation will instantly load pre-computed, realistic evaluation data without requiring API keys or incurring token costs.
          </div>
        )}

        {/* Configuration Matrix Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROMPTS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedPromptIds.length} Selected</div>
          </div>
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TEST CASES</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{Math.min(testCases.length, 6)} Active</div>
          </div>
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL RUNS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{combinations * runsPerCase} Inferences</div>
          </div>
        </div>

        {/* Prompt Selection Checkboxes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-label" style={{ marginBottom: '0.5rem' }}>Select Prompts to Benchmark</div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {prompts.map(p => (
              <label key={p.id} className="checkbox-label" style={{ background: 'var(--bg-input)', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <input
                  type="checkbox"
                  checked={selectedPromptIds.includes(p.id)}
                  onChange={() => togglePromptId(p.id)}
                />
                <span>{p.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        {running && progress && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              <span>{progress.currentTask}</span>
              <span>{progress.completed} / {progress.total}</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))',
                width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {errorMsg}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
          disabled={running}
          onClick={handleStart}
        >
          {running ? 'Running Benchmark Pipeline...' : (demoMode ? 'Load Demo Evaluation Results' : 'Run Live Benchmark Evaluation')}
        </button>
      </div>
    </div>
  );
};
