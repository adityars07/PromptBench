import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ResultsView } from './components/ResultsView';
import { PromptsView } from './components/PromptsView';
import { RunEvaluationView } from './components/RunEvaluationView';
import { TaskAndTestCases } from './components/TaskAndTestCases';
import {
  TestCase,
  PromptVersion,
  LeaderboardRow,
  PerTestResult,
  WeightSettings
} from './types';
import {
  fetchTestCases,
  fetchPrompts,
  fetchLeaderboard,
  fetchDrillDown,
  saveTestCase,
  deleteTestCase,
  savePrompt
} from './api';

export const App: React.FC = () => {
  // Global App Settings
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [selectedModels, setSelectedModels] = useState<string[]>([
    'Gemini 2.5 Flash',
    'Llama 3.3 70B'
  ]);
  const [runsPerCase, setRunsPerCase] = useState<number>(3);
  const [weights, setWeights] = useState<WeightSettings>({
    accuracy: 35,
    relevance: 25,
    consistency: 20,
    instruction: 20
  });

  // Data State
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [drillDown, setDrillDown] = useState<PerTestResult[]>([]);

  // Load Initial Data
  const loadInitialData = async () => {
    const [tc, pr, lb, dd] = await Promise.all([
      fetchTestCases(demoMode),
      fetchPrompts(demoMode),
      fetchLeaderboard(weights, demoMode),
      fetchDrillDown(demoMode)
    ]);
    setTestCases(tc);
    setPrompts(pr);
    setLeaderboard(lb);
    setDrillDown(dd);
  };

  useEffect(() => {
    loadInitialData();
  }, [demoMode]);

  // Handle Dynamic Weight Changes
  useEffect(() => {
    fetchLeaderboard(weights, demoMode).then(setLeaderboard);
  }, [weights, demoMode]);

  // Handlers for Test Cases
  const handleSaveTestCase = async (tc: TestCase) => {
    await saveTestCase(tc, demoMode);
    setTestCases(prev => {
      const idx = prev.findIndex(item => item.id === tc.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = tc;
        return next;
      }
      return [...prev, tc];
    });
  };

  const handleDeleteTestCase = async (id: string) => {
    await deleteTestCase(id, demoMode);
    setTestCases(prev => prev.filter(t => t.id !== id));
  };

  // Handlers for Prompts
  const handleSavePrompt = async (p: PromptVersion) => {
    await savePrompt(p, demoMode);
    setPrompts(prev => prev.map(item => (item.id === p.id ? p : item)));
  };

  const handleCreateNewPrompt = () => {
    const nextNum = prompts.length + 1;
    const newVersion: PromptVersion = {
      id: `v${nextNum}`,
      name: `v${nextNum} · Iterative refinement`,
      title: `v${nextNum}`,
      subtitle: 'Iterative refinement',
      temperature: 0.2,
      tempLabel: 'temp 0.2',
      changeNote: 'Iterative improvements to prompt guidance.',
      systemPrompt: 'You are a customer support triage assistant.\nReturn valid JSON only.',
      userTemplate: 'Summarise the email below into JSON format.\n\nEmail:\n{email}',
      examplesCount: 1
    };
    setPrompts(prev => [...prev, newVersion]);
  };

  const handleDuplicatePrompt = (basePrompt: PromptVersion) => {
    const nextNum = prompts.length + 1;
    const duplicated: PromptVersion = {
      ...basePrompt,
      id: `v${nextNum}`,
      name: `v${nextNum} · Copy of ${basePrompt.title}`,
      title: `v${nextNum}`,
      subtitle: `Fork of ${basePrompt.subtitle}`,
      changeNote: `Branched from ${basePrompt.title} to test parameter variations.`
    };
    setPrompts(prev => [...prev, duplicated]);
  };

  const handleEvaluationComplete = async () => {
    const lb = await fetchLeaderboard(weights, demoMode);
    setLeaderboard(lb);
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Left Sidebar */}
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

        {/* Main Content View with React Router */}
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <ResultsView
                  demoMode={demoMode}
                  weights={weights}
                  leaderboard={leaderboard}
                  drillDown={drillDown}
                />
              }
            />
            <Route
              path="/results"
              element={
                <ResultsView
                  demoMode={demoMode}
                  weights={weights}
                  leaderboard={leaderboard}
                  drillDown={drillDown}
                />
              }
            />
            <Route
              path="/task"
              element={
                <TaskAndTestCases
                  testCases={testCases}
                  onSaveTestCase={handleSaveTestCase}
                  onDeleteTestCase={handleDeleteTestCase}
                />
              }
            />
            <Route
              path="/prompts"
              element={
                <PromptsView
                  prompts={prompts}
                  onSavePrompt={handleSavePrompt}
                  onCreateNewPrompt={handleCreateNewPrompt}
                  onDuplicatePrompt={handleDuplicatePrompt}
                />
              }
            />
            <Route
              path="/run"
              element={
                <RunEvaluationView
                  prompts={prompts}
                  selectedModels={selectedModels}
                  runsPerCase={runsPerCase}
                  onRunsPerCaseChange={setRunsPerCase}
                  onEvaluationComplete={handleEvaluationComplete}
                  demoMode={demoMode}
                />
              }
            />
            {/* Fallback to /results */}
            <Route path="*" element={<Navigate to="/results" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
