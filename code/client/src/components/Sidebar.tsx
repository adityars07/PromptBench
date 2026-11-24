import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChecklistIcon,
  DocumentIcon,
  PlayIcon,
  BarChartIcon,
  DownloadIcon,
  BrandSymbol
} from './Icons';
import { WeightSettings } from '../types';

interface SidebarProps {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  selectedModels: string[];
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>;
  runsPerCase: number;
  setRunsPerCase: (val: number) => void;
  weights: WeightSettings;
  setWeights: React.Dispatch<React.SetStateAction<WeightSettings>>;
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
  const location = useLocation();
  const navigate = useNavigate();

  const toggleModel = (modelName: string) => {
    if (selectedModels.includes(modelName)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter(m => m !== modelName));
      }
    } else {
      setSelectedModels([...selectedModels, modelName]);
    }
  };

  const handleWeightChange = (key: keyof WeightSettings, val: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleExportNavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== '/' && location.pathname !== '/results') {
      navigate('/results');
    }
    setTimeout(() => {
      const exportElem = document.getElementById('export-actions');
      if (exportElem) {
        exportElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <aside className="sidebar">
      {/* 1. Logo */}
      <div className="brand-logo-area">
        <BrandSymbol size={32} />
        <span className="brand-text">PromptBench</span>
      </div>

      {/* 2. Navigation */}
      <nav className="nav-group" aria-label="Main Navigation">
        <NavLink
          to="/task"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ChecklistIcon />
          <span>Task & Test Cases</span>
        </NavLink>

        <NavLink
          to="/prompts"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <DocumentIcon />
          <span>Prompts</span>
        </NavLink>

        <NavLink
          to="/run"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <PlayIcon />
          <span>Run Evaluation</span>
        </NavLink>

        <NavLink
          to="/results"
          className={({ isActive }) =>
            `nav-item ${isActive || location.pathname === '/' ? 'active' : ''}`
          }
        >
          <BarChartIcon />
          <span>Results</span>
        </NavLink>

        <button
          onClick={handleExportNavClick}
          className="nav-item"
          aria-label="Export results"
        >
          <DownloadIcon />
          <span>Export</span>
        </button>
      </nav>

      {/* 3. Settings Card */}
      <div className="settings-card">
        <div className="settings-label">SETTINGS</div>

        <div className="settings-row">
          <span className="settings-field-title">Demo mode</span>
          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={e => setDemoMode(e.target.checked)}
              aria-label="Toggle Demo mode"
            />
          </label>
        </div>

        {/* Models Selection */}
        <div className="slider-group">
          <div className="slider-header">
            <span>Models</span>
          </div>
          <label className="checkbox-control" style={{ marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={selectedModels.includes('Gemini 2.5 Flash')}
              onChange={() => toggleModel('Gemini 2.5 Flash')}
            />
            <span>Gemini 2.5 Flash</span>
          </label>
          <label className="checkbox-control" style={{ marginTop: '2px' }}>
            <input
              type="checkbox"
              checked={selectedModels.includes('Llama 3.3 70B')}
              onChange={() => toggleModel('Llama 3.3 70B')}
            />
            <span>Llama 3.3 70B (Groq)</span>
          </label>
        </div>

        {/* Runs per case */}
        <div className="slider-group">
          <div className="slider-header">
            <span>Runs per case: {runsPerCase}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={runsPerCase}
            onChange={e => setRunsPerCase(Number(e.target.value))}
            aria-label="Runs per test case"
          />
        </div>

        {/* Score weights */}
        <div className="slider-group">
          <div className="slider-header">
            <span style={{ fontWeight: 600 }}>Score weights</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div>
              <div className="slider-header" style={{ fontSize: '12px' }}>
                <span>Accuracy {weights.accuracy}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.accuracy}
                onChange={e => handleWeightChange('accuracy', Number(e.target.value))}
                aria-label="Accuracy weight"
              />
            </div>

            <div>
              <div className="slider-header" style={{ fontSize: '12px' }}>
                <span>Relevance {weights.relevance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.relevance}
                onChange={e => handleWeightChange('relevance', Number(e.target.value))}
                aria-label="Relevance weight"
              />
            </div>

            <div>
              <div className="slider-header" style={{ fontSize: '12px' }}>
                <span>Consistency {weights.consistency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.consistency}
                onChange={e => handleWeightChange('consistency', Number(e.target.value))}
                aria-label="Consistency weight"
              />
            </div>

            <div>
              <div className="slider-header" style={{ fontSize: '12px' }}>
                <span>Instruction-following {weights.instruction}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.instruction}
                onChange={e => handleWeightChange('instruction', Number(e.target.value))}
                aria-label="Instruction-following weight"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
