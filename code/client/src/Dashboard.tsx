/**
 * Module 5: Results Dashboard (code/client/src/Dashboard.tsx)
 * Displays:
 * - Highlighted "Best prompt for this task" card with a one-line reason
 * - Leaderboard (version x model, 4 scores + weighted overall, dynamic recalculation)
 * - Grouped Bar Chart across prompt versions (Recharts)
 * - Radar Chart for deep dive into a selected prompt (Recharts)
 * - Per-Test-Case drill-down (input, expected, actual responses, scores, Pass/Fail badge)
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { EvalResult, PromptVersion, TestCase, WeightConfig, LeaderboardEntry } from './types';
import { JudgePrompt } from './components/JudgePrompt';

interface DashboardProps {
  results: EvalResult[];
  prompts: PromptVersion[];
  testCases: TestCase[];
  weights: WeightConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ results, prompts, testCases, weights }) => {
  const [selectedPromptForRadar, setSelectedPromptForRadar] = useState<string>('v3');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Normalize weights dynamically so they sum to 1.0
  const normalizedWeights = useMemo(() => {
    const sum = weights.accuracy + weights.relevance + weights.consistency + weights.instructionFollowing;
    if (sum === 0) return { accuracy: 0.25, relevance: 0.25, consistency: 0.25, instructionFollowing: 0.25 };
    return {
      accuracy: weights.accuracy / sum,
      relevance: weights.relevance / sum,
      consistency: weights.consistency / sum,
      instructionFollowing: weights.instructionFollowing / sum
    };
  }, [weights]);

  // Aggregate leaderboard entries
  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    if (!results || results.length === 0) return [];

    const comboMap = new Map<string, {
      count: number;
      acc: number;
      rel: number;
      con: number;
      ins: number;
      promptVersionId: string;
      model: string;
    }>();

    for (const r of results) {
      const key = `${r.promptVersionId}__${r.model}`;
      if (!comboMap.has(key)) {
        comboMap.set(key, {
          count: 0,
          acc: 0,
          rel: 0,
          con: 0,
          ins: 0,
          promptVersionId: r.promptVersionId,
          model: r.model
        });
      }
      const entry = comboMap.get(key)!;
      entry.count += 1;
      entry.acc += r.scores.accuracy;
      entry.rel += r.scores.relevance;
      entry.con += r.scores.consistency;
      entry.ins += r.scores.instructionFollowing;
    }

    const list: LeaderboardEntry[] = [];
    for (const [_, val] of comboMap.entries()) {
      const p = prompts.find(pr => pr.id === val.promptVersionId);
      const acc = Math.round((val.acc / val.count) * 10) / 10;
      const rel = Math.round((val.rel / val.count) * 10) / 10;
      const con = Math.round((val.con / val.count) * 10) / 10;
      const ins = Math.round((val.ins / val.count) * 10) / 10;

      // Recalculate weighted overall score using sliders
      const overall = Math.round(
        (acc * normalizedWeights.accuracy +
         rel * normalizedWeights.relevance +
         con * normalizedWeights.consistency +
         ins * normalizedWeights.instructionFollowing) * 10
      ) / 10;

      list.push({
        promptVersionId: val.promptVersionId,
        promptName: p ? p.name : val.promptVersionId,
        model: val.model,
        accuracy: acc,
        relevance: rel,
        consistency: con,
        instructionFollowing: ins,
        overall
      });
    }

    return list.sort((a, b) => b.overall - a.overall);
  }, [results, prompts, normalizedWeights]);

  // Determine best prompt
  const bestEntry = leaderboard[0];

  // Bar Chart Data aggregated by prompt version
  const barChartData = useMemo(() => {
    const versionMap = new Map<string, { count: number; acc: number; rel: number; con: number; ins: number }>();
    for (const entry of leaderboard) {
      if (!versionMap.has(entry.promptVersionId)) {
        versionMap.set(entry.promptVersionId, { count: 0, acc: 0, rel: 0, con: 0, ins: 0 });
      }
      const item = versionMap.get(entry.promptVersionId)!;
      item.count += 1;
      item.acc += entry.accuracy;
      item.rel += entry.relevance;
      item.con += entry.consistency;
      item.ins += entry.instructionFollowing;
    }

    return Array.from(versionMap.entries()).map(([vId, v]) => {
      const p = prompts.find(pr => pr.id === vId);
      return {
        name: p ? p.name.split(' - ')[0] : vId,
        Accuracy: Math.round((v.acc / v.count) * 10) / 10,
        Relevance: Math.round((v.rel / v.count) * 10) / 10,
        Consistency: Math.round((v.con / v.count) * 10) / 10,
        'Instruction-Following': Math.round((v.ins / v.count) * 10) / 10
      };
    });
  }, [leaderboard, prompts]);

  // Radar Chart Data for selected prompt version
  const radarChartData = useMemo(() => {
    const entries = leaderboard.filter(e => e.promptVersionId === selectedPromptForRadar);
    if (entries.length === 0) return [];

    const avgAcc = entries.reduce((s, e) => s + e.accuracy, 0) / entries.length;
    const avgRel = entries.reduce((s, e) => s + e.relevance, 0) / entries.length;
    const avgCon = entries.reduce((s, e) => s + e.consistency, 0) / entries.length;
    const avgIns = entries.reduce((s, e) => s + e.instructionFollowing, 0) / entries.length;

    return [
      { metric: 'Accuracy', score: Math.round(avgAcc * 10) / 10 },
      { metric: 'Relevance', score: Math.round(avgRel * 10) / 10 },
      { metric: 'Consistency', score: Math.round(avgCon * 10) / 10 },
      { metric: 'Instruction-Following', score: Math.round(avgIns * 10) / 10 }
    ];
  }, [leaderboard, selectedPromptForRadar]);

  if (!results || results.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>No Benchmark Results Yet</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Navigate to the "Run Evaluation" tab and click "Load Demo Evaluation Results" or run a live evaluation.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Best Prompt Highlight Card */}
      {bestEntry && (
        <div className="best-prompt-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🏆</span>
              <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--accent-emerald)' }}>
                Best Prompt For This Task
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {bestEntry.promptName}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Highest overall score ({bestEntry.overall}/10) across all test cases and models, with exceptional schema adherence and low variance.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-emerald)', lineHeight: 1 }}>
              {bestEntry.overall}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>
              Weighted Score
            </div>
          </div>
        </div>
      )}

      {/* 2. Leaderboard Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          Leaderboard (Version × Model Matrix)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Scores are dynamically weighted in real time based on your sidebar slider settings. Passing threshold is 7.0.
        </p>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Prompt Version</th>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Relevance</th>
                <th>Consistency</th>
                <th>Instruction-Following</th>
                <th>Overall</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const isPass = entry.overall >= 7.0;
                return (
                  <tr key={`${entry.promptVersionId}-${entry.model}`}>
                    <td style={{ fontWeight: 700, color: idx === 0 ? 'var(--accent-emerald)' : 'inherit' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{entry.promptName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{entry.model}</td>
                    <td>{entry.accuracy}</td>
                    <td>{entry.relevance}</td>
                    <td>{entry.consistency}</td>
                    <td>{entry.instructionFollowing}</td>
                    <td style={{ fontWeight: 700, color: isPass ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {entry.overall}
                    </td>
                    <td>
                      <span className={`badge ${isPass ? 'badge-pass' : 'badge-fail'}`}>
                        {isPass ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Bar Chart across versions */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
            Comparative Metric Breakdown (By Prompt Version)
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis domain={[0, 10]} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Legend />
                <Bar dataKey="Accuracy" fill="#3b82f6" />
                <Bar dataKey="Relevance" fill="#10b981" />
                <Bar dataKey="Consistency" fill="#a855f7" />
                <Bar dataKey="Instruction-Following" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart for selected prompt */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Prompt Quality Profile</h3>
            <select
              value={selectedPromptForRadar}
              onChange={e => setSelectedPromptForRadar(e.target.value)}
              style={{ width: 'auto', padding: '0.3rem 0.6rem' }}
            >
              {prompts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
                <PolarRadiusAxis domain={[0, 10]} stroke="#64748b" />
                <Radar name={selectedPromptForRadar} dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Per-Test-Case Drill-Down */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          Per-Test-Case Evaluation Drill-Down
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Inspect actual model outputs, ground truth comparisons, and individual execution runs for each test case.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {testCases.map(tc => {
            const caseResults = results.filter(r => r.testCaseId === tc.id);
            const isExpanded = expandedCaseId === tc.id;

            return (
              <div
                key={tc.id}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedCaseId(isExpanded ? null : tc.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{tc.id}</span>
                    <span className={`badge badge-${tc.type.toLowerCase()}`}>{tc.type}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tc.input}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                      {isExpanded ? '▲ Hide Details' : '▼ Inspect'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Input</div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{tc.input}</div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected Ground Truth</div>
                      <pre className="code-box" style={{ marginTop: '0.25rem' }}>{tc.expectedOutput || 'N/A'}</pre>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Candidate Prompt Responses ({caseResults.length} evaluations)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {caseResults.map((cr, idx) => {
                        const promptName = prompts.find(p => p.id === cr.promptVersionId)?.name || cr.promptVersionId;
                        return (
                          <div key={idx} style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <div>
                                <strong>{promptName}</strong> ({cr.model})
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  Acc: {cr.scores.accuracy} | Rel: {cr.scores.relevance} | Con: {cr.scores.consistency} | IF: {cr.scores.instructionFollowing}
                                </span>
                                <span className={`badge ${cr.pass ? 'badge-pass' : 'badge-fail'}`}>
                                  {cr.scores.overall} ({cr.pass ? 'PASS' : 'FAIL'})
                                </span>
                              </div>
                            </div>
                            <pre className="code-box" style={{ fontSize: '0.8rem' }}>
                              {cr.runs[0]?.response || 'No response recorded.'}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Judge Prompt Viewer Section */}
      <JudgePrompt />
    </div>
  );
};
