import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LabelList
} from 'recharts';
import { DownloadIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import {
  LeaderboardRow,
  PerTestResult,
  WeightSettings
} from '../types';
import {
  exportResultsCSV,
  exportResultsMarkdown,
  calculateWeightedOverall
} from '../api';

interface ResultsViewProps {
  demoMode: boolean;
  weights: WeightSettings;
  leaderboard: LeaderboardRow[];
  drillDown: PerTestResult[];
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  demoMode,
  weights,
  leaderboard,
  drillDown
}) => {
  const [selectedPromptRadar, setSelectedPromptRadar] = useState<string>('v3');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Recalculate leaderboard dynamically based on current weights
  const dynamicallyWeightedLeaderboard = useMemo(() => {
    const recalculated = leaderboard.map(row => {
      const overall = calculateWeightedOverall(
        row.accuracy,
        row.relevance,
        row.consistency,
        row.instruction,
        weights
      );
      return { ...row, overall };
    });
    recalculated.sort((a, b) => b.overall - a.overall);
    return recalculated.map((row, idx) => ({
      ...row,
      rank: idx + 1,
      isTop: idx === 0
    }));
  }, [leaderboard, weights]);

  const bestRow = dynamicallyWeightedLeaderboard[0] || {
    rank: 1,
    promptId: 'v3',
    promptName: 'v3',
    promptSubtitle: 'Few-shot with strict JSON',
    model: 'Gemini 2.5 Flash',
    accuracy: 8.8,
    relevance: 8.9,
    consistency: 8.4,
    instruction: 8.3,
    overall: 8.6
  };

  // Grouped Bar Chart Data
  const barChartData = useMemo(() => {
    return [
      {
        version: 'v1',
        Gemini: 4.8,
        Llama: 4.5
      },
      {
        version: 'v2',
        Gemini: 7.2,
        Llama: 6.8
      },
      {
        version: 'v3',
        Gemini: 8.6,
        Llama: 8.1
      }
    ];
  }, []);

  // Radar Chart Data (v3 vs v1)
  const radarChartData = useMemo(() => {
    if (selectedPromptRadar === 'v2') {
      return [
        { subject: 'Accuracy', selected: 7.2, baseline: 5.1, fullMark: 10 },
        { subject: 'Relevance', selected: 7.6, baseline: 6.0, fullMark: 10 },
        { subject: 'Consistency', selected: 6.5, baseline: 4.2, fullMark: 10 },
        { subject: 'Instruction', selected: 7.4, baseline: 3.5, fullMark: 10 }
      ];
    }
    // Default v3 vs v1
    return [
      { subject: 'Accuracy', selected: 8.8, baseline: 5.1, fullMark: 10 },
      { subject: 'Relevance', selected: 8.9, baseline: 6.0, fullMark: 10 },
      { subject: 'Consistency', selected: 8.4, baseline: 4.2, fullMark: 10 },
      { subject: 'Instruction', selected: 8.3, baseline: 3.5, fullMark: 10 }
    ];
  }, [selectedPromptRadar]);

  const handleDownloadCSV = () => {
    exportResultsCSV(dynamicallyWeightedLeaderboard, drillDown);
  };

  const handleDownloadMD = () => {
    exportResultsMarkdown(bestRow, dynamicallyWeightedLeaderboard, drillDown);
  };

  const toggleExpand = (id: string) => {
    setExpandedTestId(expandedTestId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="page-subtitle">
            Support email to JSON summary · 12 test cases · 3 runs each · 2 models
          </p>
        </div>
        <div className="header-actions" id="export-actions">
          {demoMode && <span className="chip chip-muted">Sample data</span>}
          <button
            onClick={handleDownloadCSV}
            className="btn btn-secondary"
            aria-label="Download results CSV"
          >
            <DownloadIcon />
            <span>CSV</span>
          </button>
          <button
            onClick={handleDownloadMD}
            className="btn btn-primary"
            aria-label="Download results Markdown report"
          >
            <DownloadIcon />
            <span>Markdown report</span>
          </button>
        </div>
      </div>

      {/* Best prompt banner */}
      <section className="best-prompt-banner" aria-label="Best prompt summary">
        <div>
          <div className="best-banner-label">BEST PROMPT FOR THIS TASK</div>
          <h2 className="best-banner-title">
            {bestRow.promptId} · {bestRow.promptSubtitle || 'Few-shot with strict JSON'}
          </h2>
          <p className="best-banner-reason">
            Runs on {bestRow.model}. Two graded examples and temperature 0.2 gave the most
            consistent JSON across all 3 runs.
          </p>
        </div>
        <div className="best-banner-score-box">
          <span className="best-banner-score tabular-nums">{bestRow.overall.toFixed(1)}</span>
          <span className="best-banner-score-sub">/ 10</span>
        </div>
      </section>

      {/* Four Metric Cards */}
      <section className="metric-grid" aria-label="Performance metric cards">
        <div className="metric-card">
          <div className="metric-label">Accuracy</div>
          <div className="metric-value tabular-nums">{bestRow.accuracy.toFixed(1)}</div>
          <div className="metric-progress-track">
            <div
              className="metric-progress-fill"
              style={{ width: `${(bestRow.accuracy / 10) * 100}%` }}
              aria-label={`Accuracy ${bestRow.accuracy} of 10`}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Relevance</div>
          <div className="metric-value tabular-nums">{bestRow.relevance.toFixed(1)}</div>
          <div className="metric-progress-track">
            <div
              className="metric-progress-fill"
              style={{ width: `${(bestRow.relevance / 10) * 100}%` }}
              aria-label={`Relevance ${bestRow.relevance} of 10`}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Consistency</div>
          <div className="metric-value tabular-nums">{bestRow.consistency.toFixed(1)}</div>
          <div className="metric-progress-track">
            <div
              className="metric-progress-fill"
              style={{ width: `${(bestRow.consistency / 10) * 100}%` }}
              aria-label={`Consistency ${bestRow.consistency} of 10`}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Instruction-following</div>
          <div className="metric-value tabular-nums">{bestRow.instruction.toFixed(1)}</div>
          <div className="metric-progress-track">
            <div
              className="metric-progress-fill"
              style={{ width: `${(bestRow.instruction / 10) * 100}%` }}
              aria-label={`Instruction-following ${bestRow.instruction} of 10`}
            />
          </div>
        </div>
      </section>

      {/* Leaderboard Table Card */}
      <section className="card" aria-label="Leaderboard section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title">Leaderboard</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Overall uses your weight sliders
          </span>
        </div>

        <div className="table-container">
          <table className="spec-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Prompt</th>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Relevance</th>
                <th>Consistency</th>
                <th>Instruction</th>
                <th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {dynamicallyWeightedLeaderboard.map((row) => (
                <tr key={`${row.promptId}-${row.model}`} className={row.isTop ? 'top-row' : ''}>
                  <td className="tabular-nums" style={{ fontWeight: 600 }}>{row.rank}</td>
                  <td style={{ fontWeight: 600 }}>{row.promptName}</td>
                  <td style={{ color: 'var(--text-mid)' }}>{row.model}</td>
                  <td className="tabular-nums">{row.accuracy.toFixed(1)}</td>
                  <td className="tabular-nums">{row.relevance.toFixed(1)}</td>
                  <td className="tabular-nums">{row.consistency.toFixed(1)}</td>
                  <td className="tabular-nums">{row.instruction.toFixed(1)}</td>
                  <td
                    className="tabular-nums"
                    style={{
                      fontWeight: 700,
                      color: row.isTop ? 'var(--accent-indigo)' : 'var(--text-primary)'
                    }}
                  >
                    {row.overall.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two Cards Side by Side (Charts) */}
      <section className="two-col-grid">
        {/* Card (a): Bar Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="card-title">Overall score by version</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--chart-gemini)', borderRadius: '2px' }} />
                <span>Gemini</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--chart-llama)', borderRadius: '2px' }} />
                <span>Llama</span>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '240px' }} aria-label="Grouped bar chart showing scores by version">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E0" />
                <XAxis dataKey="version" stroke="#5F646D" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="#5F646D" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E5E0',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                />
                <Bar dataKey="Gemini" fill="var(--chart-gemini)" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="Gemini" position="top" style={{ fill: '#1B1D22', fontSize: '12px', fontWeight: 600 }} />
                </Bar>
                <Bar dataKey="Llama" fill="var(--chart-llama)" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="Llama" position="top" style={{ fill: '#1B1D22', fontSize: '12px', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card (b): Radar Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="card-title">
                {selectedPromptRadar} vs v1 on Gemini
              </h3>
              <select
                value={selectedPromptRadar}
                onChange={e => setSelectedPromptRadar(e.target.value)}
                style={{
                  width: 'auto',
                  padding: '4px 8px',
                  height: '28px',
                  fontSize: '12px',
                  borderRadius: '6px'
                }}
                aria-label="Select prompt version for radar comparison"
              >
                <option value="v3">v3</option>
                <option value="v2">v2</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-indigo)', borderRadius: '2px' }} />
                <span>{selectedPromptRadar}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #94A3B8' }} />
                <span>v1</span>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '240px' }} aria-label="Radar chart comparing prompt quality against baseline">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData} outerRadius="75%">
                <PolarGrid stroke="#E7E5E0" />
                <PolarAngleAxis dataKey="subject" stroke="#5F646D" tick={{ fontSize: 12, fill: '#5F646D' }} />
                <PolarRadiusAxis domain={[0, 10]} stroke="#D9D6CF" tick={false} axisLine={false} />
                <Radar
                  name="v1 (baseline)"
                  dataKey="baseline"
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  fill="none"
                />
                <Radar
                  name={selectedPromptRadar}
                  dataKey="selected"
                  stroke="var(--accent-indigo)"
                  strokeWidth={2}
                  fill="rgba(67, 56, 202, 0.18)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E5E0',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Per-test drill-down table */}
      <section className="card" aria-label="Per-test drill-down section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title">Per-test drill-down · v3 on Gemini</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Pass means overall 7 or higher
          </span>
        </div>

        <div className="table-container">
          <table className="spec-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Test</th>
                <th style={{ width: '100px' }}>Type</th>
                <th>Input</th>
                <th>Accuracy</th>
                <th>Relevance</th>
                <th>Consistency</th>
                <th>Instruction</th>
                <th style={{ width: '80px' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {drillDown.map((d) => {
                const isExpanded = expandedTestId === d.testId;
                const typeClass =
                  d.type === 'Normal' ? 'chip-normal' : d.type === 'Edge' ? 'chip-edge' : 'chip-invalid';
                const passClass = d.pass ? 'chip-pass' : 'chip-fail';

                return (
                  <React.Fragment key={d.testId}>
                    <tr
                      className="clickable"
                      onClick={() => toggleExpand(d.testId)}
                      aria-expanded={isExpanded}
                    >
                      <td style={{ fontWeight: 600 }}>{d.testId}</td>
                      <td>
                        <span className={`chip ${typeClass}`}>{d.type}</span>
                      </td>
                      <td style={{ color: 'var(--text-mid)', maxWidth: '380px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.input}
                          </span>
                          {isExpanded ? (
                            <ChevronUpIcon size={14} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
                          ) : (
                            <ChevronDownIcon size={14} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
                          )}
                        </div>
                      </td>
                      <td className="tabular-nums">{d.accuracy.toFixed(1)}</td>
                      <td className="tabular-nums">{d.relevance.toFixed(1)}</td>
                      <td className="tabular-nums">{d.consistency.toFixed(1)}</td>
                      <td className="tabular-nums">{d.instruction.toFixed(1)}</td>
                      <td>
                        <span className={`chip ${passClass}`}>{d.pass ? 'Pass' : 'Fail'}</span>
                      </td>
                    </tr>

                    {/* Expanded inspection details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ backgroundColor: '#FAF9F6', padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Full Input Text
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                {d.input}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Expected Ground Truth
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                {d.expected}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Actual Output from v3 on Gemini
                              </div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--text-primary)',
                                  fontFamily: 'var(--font-mono)',
                                  backgroundColor: '#FFFFFF',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-card)'
                                }}
                              >
                                {d.actual}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
