import React from 'react';
import { WeightConfig } from '../types';

interface SidebarProps {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  selectedModels: string[];
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>;
  runsPerCase: number;
  setRunsPerCase: (val: number) => void;
  weights: WeightConfig;
  setWeights: React.Dispatch<React.SetStateAction<WeightConfig>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  demoMode,
  setDemoMode,
  selectedModels,
  setSelectedModels,
  runsPerCase,
  setRunsPerCase,
  weights,
  setWeights
}) => {
  const toggleModel = (m: string) => {
    if (selectedModels.includes(m)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter(item => item !== m));
      }
    } else {
      setSelectedModels([...selectedModels, m]);
    }
  };

  const handleWeightChange = (key: keyof WeightConfig, val: number) => {
    setWeights(prev => ({ ...prev, [key]: val }));
  };

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-logo">⚡</div>
        <div>
          <div className="brand-title">PromptBench</div>
          <div className="brand-subtitle">Evaluation Suite</div>
        </div>
      </div>

      {/* Demo Mode Toggle */}
      <div className="sidebar-section">
        <div className="toggle-wrapper">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Demo Mode</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Uses cached benchmarks
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={e => setDemoMode(e.target.checked)}
            />
            <span className="slider-round"></span>
          </label>
        </div>
      </div>

      {/* Model Selection */}
      <div className="sidebar-section">
        <div className="section-label">Target Models</div>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedModels.includes('gemini-1.5-flash')}
              onChange={() => toggleModel('gemini-1.5-flash')}
            />
            <span>Google Gemini 1.5 Flash</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedModels.includes('llama-3.1-8b-instant')}
              onChange={() => toggleModel('llama-3.1-8b-instant')}
            />
            <span>Groq Llama 3.1 8B</span>
          </label>
        </div>
      </div>

      {/* Runs Per Case */}
      <div className="sidebar-section">
        <div className="range-header">
          <span className="section-label">Runs per Test Case</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{runsPerCase}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={runsPerCase}
          onChange={e => setRunsPerCase(Number(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>1 (Fast)</span>
          <span>3 (Default)</span>
          <span>5 (Deep)</span>
        </div>
      </div>

      {/* Metric Weight Sliders */}
      <div className="sidebar-section">
        <div className="section-label">Metric Weights</div>
        
        <div className="range-container">
          <div className="range-header">
            <span>Accuracy</span>
            <span>{Math.round(weights.accuracy * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.accuracy}
            onChange={e => handleWeightChange('accuracy', parseFloat(e.target.value))}
          />
        </div>

        <div className="range-container">
          <div className="range-header">
            <span>Relevance</span>
            <span>{Math.round(weights.relevance * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.relevance}
            onChange={e => handleWeightChange('relevance', parseFloat(e.target.value))}
          />
        </div>

        <div className="range-container">
          <div className="range-header">
            <span>Consistency</span>
            <span>{Math.round(weights.consistency * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.consistency}
            onChange={e => handleWeightChange('consistency', parseFloat(e.target.value))}
          />
        </div>

        <div className="range-container">
          <div className="range-header">
            <span>Instruction Following</span>
            <span>{Math.round(weights.instructionFollowing * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.instructionFollowing}
            onChange={e => handleWeightChange('instructionFollowing', parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* Team PromptX Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div><strong>Team PromptX</strong></div>
        <div>Kartikey Pandey (S24CSEU1344)</div>
        <div>Aditya (S24CSEU1357)</div>
      </div>
    </aside>
  );
};
