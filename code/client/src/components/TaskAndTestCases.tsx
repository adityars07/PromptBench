import React, { useState } from 'react';
import { TestCase } from '../types';
import { createTestCase, deleteTestCase } from '../api';

interface TaskAndTestCasesProps {
  testCases: TestCase[];
  refreshTestCases: () => void;
}

export const TaskAndTestCases: React.FC<TaskAndTestCasesProps> = ({ testCases, refreshTestCases }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [newType, setNewType] = useState<'Normal' | 'Edge' | 'Invalid'>('Normal');
  const [newKeyPoints, setNewKeyPoints] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInput.trim()) return;

    await createTestCase({
      input: newInput,
      expectedOutput: newExpected,
      type: newType,
      keyPoints: newKeyPoints.split(',').map(s => s.trim()).filter(Boolean),
      constraints: { validJson: true, requiredKeys: ['issue', 'urgency', 'suggested_action'] }
    });

    setNewInput('');
    setNewExpected('');
    setNewKeyPoints('');
    setShowAddModal(false);
    refreshTestCases();
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete test case ${id}?`)) {
      await deleteTestCase(id);
      refreshTestCases();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Benchmark Task Hero Card */}
      <div className="card hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="badge badge-normal" style={{ marginBottom: '0.5rem' }}>Active Evaluation Benchmark</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.5rem 0' }}>
              Customer Support Email Triage & Summarisation
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '800px', fontSize: '0.95rem' }}>
              Extract key incident information into a strict JSON payload with keys:
              <code style={{ color: 'var(--accent-cyan)', margin: '0 4px' }}>issue</code>,
              <code style={{ color: 'var(--accent-cyan)', margin: '0 4px' }}>urgency (low/medium/high)</code>, and
              <code style={{ color: 'var(--accent-cyan)', margin: '0 4px' }}>suggested_action</code>.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Test Case
          </button>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Test Cases Suite ({testCases.length})</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Balanced dataset covering Normal operational requests, complex Edge cases, and Invalid inputs.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '100px' }}>Type</th>
                <th>Input Customer Communication</th>
                <th>Expected Ground Truth</th>
                <th style={{ width: '80px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map(tc => (
                <tr key={tc.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{tc.id}</td>
                  <td>
                    <span className={`badge badge-${tc.type.toLowerCase()}`}>
                      {tc.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ maxHeight: '70px', overflowY: 'auto' }}>{tc.input}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    <div style={{ maxHeight: '70px', overflowY: 'auto' }}>{tc.expectedOutput || 'N/A'}</div>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleDelete(tc.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '550px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Test Case</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value as any)}>
                  <option value="Normal">Normal</option>
                  <option value="Edge">Edge</option>
                  <option value="Invalid">Invalid</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Input Text</label>
                <textarea rows={3} value={newInput} onChange={e => setNewInput(e.target.value)} required placeholder="Customer email..." />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Expected Output (JSON)</label>
                <textarea rows={2} value={newExpected} onChange={e => setNewExpected(e.target.value)} placeholder='{"issue": "...", "urgency": "...", "suggested_action": "..."}' />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Key Points (comma-separated)</label>
                <input type="text" value={newKeyPoints} onChange={e => setNewKeyPoints(e.target.value)} placeholder="high urgency, refund, 2FA lockout" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Test Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
