import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayIcon } from './Icons';
import { PromptVersion, EvalProgressState } from '../types';
import { JUDGE_PROMPT_TEXT, MOCK_PROGRESS } from '../mock';

interface RunEvaluationViewProps {
  prompts: PromptVersion[];
  selectedModels: string[];
  runsPerCase: number;
  onRunsPerCaseChange: (n: number) => void;
  onEvaluationComplete: () => void;
  demoMode: boolean;
}

export const RunEvaluationView: React.FC<RunEvaluationViewProps> = ({
  prompts,
  selectedModels,
  runsPerCase,
  onRunsPerCaseChange,
  onEvaluationComplete,
  demoMode
}) => {
  const navigate = useNavigate();

  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>(
    prompts.map(p => p.id)
  );
  const [selectedModelList, setSelectedModelList] = useState<string[]>(selectedModels);
  const [progressState, setProgressState] = useState<EvalProgressState>(MOCK_PROGRESS);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Sync selected models if parent updates
  useEffect(() => {
    setSelectedModelList(selectedModels);
  }, [selectedModels]);

  const togglePrompt = (id: string) => {
    if (selectedPromptIds.includes(id)) {
      if (selectedPromptIds.length > 1) {
        setSelectedPromptIds(selectedPromptIds.filter(p => p !== id));
      }
    } else {
      setSelectedPromptIds([...selectedPromptIds, id]);
    }
  };

  const toggleModel = (model: string) => {
    if (selectedModelList.includes(model)) {
      if (selectedModelList.length > 1) {
        setSelectedModelList(selectedModelList.filter(m => m !== model));
      }
    } else {
      setSelectedModelList([...selectedModelList, model]);
    }
  };

  // Calculation formula
  const numPrompts = selectedPromptIds.length;
  const numTests = 12;
  const numModels = selectedModelList.length;
  const totalCalls = numPrompts * numTests * numModels * runsPerCase;
  const halfCalls = Math.floor(totalCalls / (numModels || 1));

  const handleStartEvaluation = () => {
    setIsEvaluating(true);
    setProgressState({
      completedCalls: 0,
      totalCalls: totalCalls,
      geminiCompleted: 0,
      geminiTotal: halfCalls,
      llamaCompleted: 0,
      llamaTotal: halfCalls,
      retries: 0,
      isRunning: true,
      logs: [
        { id: '1', text: `${selectedPromptIds[0] || 'v3'} · T1 · Gemini · run 1 of ${runsPerCase} · running`, status: 'running' },
        { id: '2', text: `${selectedPromptIds[0] || 'v3'} · T1 · Llama · run 1 of ${runsPerCase} · queued`, status: 'queued' },
        { id: '3', text: `${selectedPromptIds[1] || 'v2'} · T1 · Gemini · run 1 of ${runsPerCase} · queued`, status: 'queued' }
      ]
    });

    // Simulate animated evaluation progress
    const steps = 15;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const ratio = step / steps;
      const currentCompleted = Math.min(totalCalls, Math.round(totalCalls * ratio));
      const gComp = Math.min(halfCalls, Math.round(halfCalls * ratio));
      const lComp = Math.min(halfCalls, Math.round(halfCalls * ratio));

      setProgressState({
        completedCalls: currentCompleted,
        totalCalls: totalCalls,
        geminiCompleted: gComp,
        geminiTotal: halfCalls,
        llamaCompleted: lComp,
        llamaTotal: halfCalls,
        retries: step > 5 ? 2 : 0,
        isRunning: true,
        logs: [
          { id: '1', text: `v3 · T${Math.min(12, step + 1)} · Gemini · run ${((step % runsPerCase) + 1)} of ${runsPerCase} · done`, status: 'done' },
          { id: '2', text: `v3 · T${Math.min(12, step + 1)} · Gemini · run ${(((step + 1) % runsPerCase) + 1)} of ${runsPerCase} · running`, status: 'running' },
          { id: '3', text: `v3 · T${Math.min(12, step + 2)} · Llama · run 1 of ${runsPerCase} · queued`, status: 'queued' }
        ]
      });

      if (step >= steps) {
        clearInterval(interval);
        setIsEvaluating(false);
        onEvaluationComplete();
        setTimeout(() => {
          navigate('/results');
        }, 800);
      }
    }, 200);
  };

  const progressPercent = Math.min(100, Math.round((progressState.completedCalls / (progressState.totalCalls || 1)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Run Evaluation</h1>
          <p className="page-subtitle">
            Choose what to compare, then run every prompt against every test case
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="run-eval-layout">
        {/* Left: Setup Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 className="card-title">Setup</h2>

          {/* Prompt versions checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Prompt versions
            </span>
            {prompts.map((p) => (
              <label key={p.id} className="checkbox-control">
                <input
                  type="checkbox"
                  checked={selectedPromptIds.includes(p.id)}
                  onChange={() => togglePrompt(p.id)}
                />
                <span style={{ fontSize: '14px' }}>{p.name}</span>
              </label>
            ))}
          </div>

          {/* Models checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Models
            </span>
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={selectedModelList.includes('Gemini 2.5 Flash')}
                onChange={() => toggleModel('Gemini 2.5 Flash')}
              />
              <span style={{ fontSize: '14px' }}>Gemini 2.5 Flash</span>
            </label>
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={selectedModelList.includes('Llama 3.3 70B')}
                onChange={() => toggleModel('Llama 3.3 70B')}
              />
              <span style={{ fontSize: '14px' }}>Llama 3.3 70B (Groq)</span>
            </label>
          </div>

          {/* Runs per case slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="slider-header">
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Runs per case: {runsPerCase}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={runsPerCase}
              onChange={e => onRunsPerCaseChange(Number(e.target.value))}
              aria-label="Runs per case slider"
            />
          </div>

          {/* Formula Summary Box */}
          <div className="call-formula-box">
            <span className="formula-label">This run will make</span>
            <span className="formula-big-number tabular-nums">{totalCalls} calls</span>
            <span className="formula-sub">
              {numPrompts} prompts × {numTests} tests × {numModels} models × {runsPerCase} runs
            </span>
          </div>

          {/* Start Evaluation Button */}
          <button
            onClick={handleStartEvaluation}
            disabled={isEvaluating}
            className="btn btn-primary"
            style={{ width: '100%', height: '48px', fontSize: '15px' }}
            aria-label="Start evaluation batch"
          >
            <PlayIcon size={16} fill="currentColor" />
            <span>{isEvaluating ? 'Evaluating...' : 'Start evaluation'}</span>
          </button>
        </div>

        {/* Right: Progress & Judge Prompt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Progress */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Progress</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="tabular-nums">
                {progressState.completedCalls} of {progressState.totalCalls} calls
              </span>
            </div>

            {/* 10px Progress Bar */}
            <div
              className="progress-bar-container"
              role="progressbar"
              aria-valuenow={progressState.completedCalls}
              aria-valuemin={0}
              aria-valuemax={progressState.totalCalls}
              aria-label="Evaluation progress bar"
            >
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Mini Stats Grid */}
            <div className="mini-stats-grid">
              <div className="mini-stat-card">
                <span className="mini-stat-label">Gemini 2.5 Flash</span>
                <span className="mini-stat-val tabular-nums">
                  {progressState.geminiCompleted} / {progressState.geminiTotal}
                </span>
              </div>

              <div className="mini-stat-card">
                <span className="mini-stat-label">Llama 3.3 70B</span>
                <span className="mini-stat-val tabular-nums">
                  {progressState.llamaCompleted} / {progressState.llamaTotal}
                </span>
              </div>
            </div>

            {/* Retries Mini Stat */}
            <div className="mini-stat-card" style={{ marginBottom: '16px', maxWidth: '160px' }}>
              <span className="mini-stat-label">Retries</span>
              <span className="mini-stat-val tabular-nums">{progressState.retries}</span>
            </div>

            {/* Monospace Live Log */}
            <div className="live-log-box" aria-live="polite">
              {progressState.logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Judge Prompt */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Judge prompt</h2>
              <span className="chip chip-muted">Fixed · temperature 0 · JSON only</span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Accuracy and relevance are scored by this prompt. Consistency and instruction-following are
              computed in code.
            </p>

            <pre
              style={{
                backgroundColor: 'var(--bg-page)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}
            >
              {JUDGE_PROMPT_TEXT}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
