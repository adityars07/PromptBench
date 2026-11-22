import React, { useEffect, useState } from 'react';
import { fetchJudgePrompt } from '../api';

export const JudgePrompt: React.FC = () => {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    fetchJudgePrompt().then(setPrompt);
  }, []);

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>⚖️</span>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>LLM-as-a-Judge Fixed System Prompt</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Evaluates candidate model outputs against expected ground truth at temperature 0 with strict JSON enforcement.
      </p>
      <pre className="code-box" style={{ maxHeight: '250px' }}>{prompt}</pre>
    </div>
  );
};
