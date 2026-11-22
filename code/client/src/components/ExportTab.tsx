import React, { useState, useEffect } from 'react';

export const ExportTab: React.FC = () => {
  const [markdownPreview, setMarkdownPreview] = useState('Loading report preview...');

  useEffect(() => {
    fetch('/api/export/markdown')
      .then(res => res.text())
      .then(setMarkdownPreview)
      .catch(() => setMarkdownPreview('No evaluation results currently available.'));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Export Benchmark Deliverables
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Download clean datasets for statistical reporting or download complete Markdown evaluation reports.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/api/export/csv" download="promptbench_evaluation.csv" className="btn btn-primary">
            📥 Download CSV Dataset
          </a>
          <a href="/api/export/markdown" download="promptbench_report.md" className="btn btn-secondary">
            📄 Download Markdown Report
          </a>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Live Report Preview
        </h3>
        <pre className="code-box" style={{ maxHeight: '450px', whiteSpace: 'pre-wrap' }}>
          {markdownPreview}
        </pre>
      </div>
    </div>
  );
};
