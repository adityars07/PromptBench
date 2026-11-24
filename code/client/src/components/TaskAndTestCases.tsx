import React, { useState } from 'react';
import { PlusIcon, CloseIcon } from './Icons';
import { TestCase } from '../types';

interface TaskAndTestCasesProps {
  testCases: TestCase[];
  onSaveTestCase: (tc: TestCase) => void;
  onDeleteTestCase: (id: string) => void;
}

export const TaskAndTestCases: React.FC<TaskAndTestCasesProps> = ({
  testCases,
  onSaveTestCase,
  onDeleteTestCase
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal form state
  const [formInput, setFormInput] = useState('');
  const [formExpected, setFormExpected] = useState('');
  const [formType, setFormType] = useState<'Normal' | 'Edge' | 'Invalid'>('Normal');
  const [formMaxWords, setFormMaxWords] = useState<number | ''>('');
  const [formValidJson, setFormValidJson] = useState(true);
  const [formLanguage, setFormLanguage] = useState('');
  const [formRequiredKeys, setFormRequiredKeys] = useState('issue, urgency, suggested_action');

  // Count calculations
  const totalCount = testCases.length;
  const normalCount = testCases.filter(t => t.type === 'Normal').length;
  const edgeCount = testCases.filter(t => t.type === 'Edge').length;
  const invalidCount = testCases.filter(t => t.type === 'Invalid').length;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormInput('');
    setFormExpected('');
    setFormType('Normal');
    setFormMaxWords('');
    setFormValidJson(true);
    setFormLanguage('');
    setFormRequiredKeys('issue, urgency, suggested_action');
    setModalOpen(true);
  };

  const handleOpenEdit = (tc: TestCase) => {
    setEditingId(tc.id);
    setFormInput(tc.input);
    setFormExpected(tc.expectedOutput);
    setFormType(tc.type);
    setFormMaxWords(tc.constraints?.maxWords ?? '');
    setFormValidJson(tc.constraints?.validJson ?? true);
    setFormLanguage(tc.constraints?.language ?? '');
    setFormRequiredKeys(tc.constraints?.requiredKeys?.join(', ') || 'issue, urgency, suggested_action');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.trim()) return;

    const reqKeys = formRequiredKeys.split(',').map(k => k.trim()).filter(Boolean);
    const updatedCase: TestCase = {
      id: editingId || `T${testCases.length + 1}`,
      type: formType,
      input: formInput,
      expectedOutput: formExpected,
      constraintsSummary: formValidJson
        ? `Valid JSON · ${reqKeys.length || 3} keys`
        : formMaxWords ? `Max ${formMaxWords} words` : 'Standard constraints',
      constraints: {
        validJson: formValidJson,
        maxWords: formMaxWords ? Number(formMaxWords) : undefined,
        language: formLanguage || undefined,
        requiredKeys: reqKeys
      }
    };

    onSaveTestCase(updatedCase);
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingId) {
      onDeleteTestCase(editingId);
      setModalOpen(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task & Test Cases</h1>
          <p className="page-subtitle">
            Define what the prompts must do and the inputs they are judged on
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          aria-label="Add new test case"
        >
          <PlusIcon />
          <span>Add test case</span>
        </button>
      </div>

      {/* Task statement card */}
      <section className="task-highlight-card" aria-label="Task definition">
        <span className="task-label-caps">TASK</span>
        <p className="task-statement">
          Summarise a customer support email into JSON with the keys{' '}
          <span className="task-key-tag">issue</span>,{' '}
          <span className="task-key-tag">urgency</span> (low, medium or high) and{' '}
          <span className="task-key-tag">suggested_action</span>.
        </p>
      </section>

      {/* Four Count Cards */}
      <section className="count-cards-grid" aria-label="Test case counts summary">
        <div className="count-card">
          <span className="count-card-label">Total</span>
          <span className="count-card-num tabular-nums">{totalCount}</span>
        </div>
        <div className="count-card">
          <span className="count-card-label">Normal</span>
          <span className="count-card-num tabular-nums">{normalCount}</span>
        </div>
        <div className="count-card">
          <span className="count-card-label">Edge</span>
          <span className="count-card-num tabular-nums">{edgeCount}</span>
        </div>
        <div className="count-card">
          <span className="count-card-label">Invalid</span>
          <span className="count-card-num tabular-nums">{invalidCount}</span>
        </div>
      </section>

      {/* Test cases table card */}
      <section className="card" aria-label="Test cases list table">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="card-title">Test cases</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="tabular-nums">
            Showing {testCases.length} of {totalCount}
          </span>
        </div>

        <div className="table-container">
          <table className="spec-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th style={{ width: '90px' }}>Type</th>
                <th style={{ minWidth: '220px' }}>Input</th>
                <th style={{ minWidth: '240px' }}>Expected</th>
                <th style={{ minWidth: '160px' }}>Constraints</th>
                <th style={{ width: '60px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((tc) => {
                const typeClass =
                  tc.type === 'Normal' ? 'chip-normal' : tc.type === 'Edge' ? 'chip-edge' : 'chip-invalid';
                return (
                  <tr key={tc.id}>
                    <td style={{ fontWeight: 600 }}>{tc.id}</td>
                    <td>
                      <span className={`chip ${typeClass}`}>{tc.type}</span>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{tc.input}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {tc.expectedOutput}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {tc.constraintsSummary || 'Valid JSON · 3 keys'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEdit(tc)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-indigo)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                        aria-label={`Edit test case ${tc.id}`}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Side Panel Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="side-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ fontSize: '18px' }}>
                {editingId ? `Edit Test Case ${editingId}` : 'Add Test Case'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                aria-label="Close dialog"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Case Type
                </label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as any)}
                >
                  <option value="Normal">Normal</option>
                  <option value="Edge">Edge</option>
                  <option value="Invalid">Invalid</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Input Customer Email
                </label>
                <textarea
                  rows={3}
                  value={formInput}
                  onChange={e => setFormInput(e.target.value)}
                  placeholder="Paste or write the customer email message..."
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Expected Ground Truth
                </label>
                <textarea
                  rows={3}
                  value={formExpected}
                  onChange={e => setFormExpected(e.target.value)}
                  placeholder="Expected summary, key issues, or JSON structure..."
                />
              </div>

              {/* Constraints group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Verification Constraints
                </span>

                <label className="checkbox-control">
                  <input
                    type="checkbox"
                    checked={formValidJson}
                    onChange={e => setFormValidJson(e.target.checked)}
                  />
                  <span>Must be valid JSON</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Max words</label>
                    <input
                      type="number"
                      value={formMaxWords}
                      onChange={e => setFormMaxWords(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Language</label>
                    <input
                      type="text"
                      value={formLanguage}
                      onChange={e => setFormLanguage(e.target.value)}
                      placeholder="e.g. en"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Required JSON keys (comma separated)</label>
                  <input
                    type="text"
                    value={formRequiredKeys}
                    onChange={e => setFormRequiredKeys(e.target.value)}
                    placeholder="issue, urgency, suggested_action"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                {editingId ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--chip-invalid-text)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '8px 4px'
                    }}
                  >
                    Delete test case
                  </button>
                ) : <span />}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save test case
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
