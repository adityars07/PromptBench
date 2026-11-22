import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TaskAndTestCases } from './components/TaskAndTestCases';
import { Prompts } from './components/Prompts';
import { RunEvaluation } from './components/RunEvaluation';
import { Dashboard } from './Dashboard';
import { ExportTab } from './components/ExportTab';
import { TestCase, PromptVersion, EvalResult, WeightConfig } from './types';
import { fetchTestCases, fetchPrompts, fetchResults, fetchCachedResults } from './api';

type TabType = 'task' | 'prompts' | 'run' | 'results' | 'export';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('results');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [selectedModels, setSelectedModels] = useState<string[]>(['gemini-1.5-flash', 'llama-3.1-8b-instant']);
  const [runsPerCase, setRunsPerCase] = useState<number>(3);
  const [weights, setWeights] = useState<WeightConfig>({
    accuracy: 0.25,
    relevance: 0.25,
    consistency: 0.25,
    instructionFollowing: 0.25
  });

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [results, setResults] = useState<EvalResult[]>([]);

  const loadData = async () => {
    const [tcData, promptData] = await Promise.all([
      fetchTestCases(),
      fetchPrompts()
    ]);
    setTestCases(tcData);
    setPrompts(promptData);

    // Initial results load
    try {
      const res = await fetchResults();
      if (res && res.length > 0) {
        setResults(res);
      } else {
        const cached = await fetchCachedResults();
        setResults(cached.results);
      }
    } catch {
      const cached = await fetchCachedResults();
      setResults(cached.results);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEvaluationComplete = async () => {
    const res = await fetchResults();
    setResults(res);
    setActiveTab('results');
  };

  return (
    <div className="app-container">
      <Sidebar
        demoMode={demoMode}
        setDemoMode={setDemoMode}
        selectedModels={selectedModels}
        setSelectedModels={setSelectedModels}
        runsPerCase={runsPerCase}
        setRunsPerCase={setRunsPerCase}
        weights={weights}
        setWeights={setWeights}
      />

      <main className="main-wrapper">
        <header className="top-navbar">
          <nav className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'task' ? 'active' : ''}`}
              onClick={() => setActiveTab('task')}
            >
              📋 Task & Test Cases
            </button>
            <button
              className={`tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
              onClick={() => setActiveTab('prompts')}
            >
              ✍️ Prompts Repository
            </button>
            <button
              className={`tab-btn ${activeTab === 'run' ? 'active' : ''}`}
              onClick={() => setActiveTab('run')}
            >
              ⚡ Run Evaluation
            </button>
            <button
              className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              📊 Results Dashboard
            </button>
            <button
              className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              📥 Export
            </button>
          </nav>
        </header>

        <section className="content-body">
          {activeTab === 'task' && (
            <TaskAndTestCases testCases={testCases} refreshTestCases={loadData} />
          )}
          {activeTab === 'prompts' && (
            <Prompts prompts={prompts} refreshPrompts={loadData} />
          )}
          {activeTab === 'run' && (
            <RunEvaluation
              prompts={prompts}
              testCases={testCases}
              selectedModels={selectedModels}
              runsPerCase={runsPerCase}
              demoMode={demoMode}
              onEvaluationComplete={handleEvaluationComplete}
            />
          )}
          {activeTab === 'results' && (
            <Dashboard
              results={results}
              prompts={prompts}
              testCases={testCases}
              weights={weights}
            />
          )}
          {activeTab === 'export' && <ExportTab />}
        </section>
      </main>
    </div>
  );
};

export default App;
