import React, { useState } from 'react';
import { PromptVersion } from '../types';
import { createPrompt, deletePrompt } from '../api';

interface PromptsProps {
  prompts: PromptVersion[];
  refreshPrompts: () => void;
}

export const Prompts: React.FC<PromptsProps> = ({ prompts, refreshPrompts }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userTemplate, setUserTemplate] = useState('Customer Email:\n{email_text}');
  const [temperature, setTemperature] = useState(0.7);
  const [changeNote, setChangeNote] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createPrompt({
      name,
      systemPrompt,
      userTemplate,
      temperature,
      changeNote
    });

    setName('');
    setSystemPrompt('');
    setChangeNote('');
    setShowAddModal(false);
    refreshPrompts();
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete prompt version ${id}?`)) {
      await deletePrompt(id);
      refreshPrompts();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Prompt Version Repository</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Iterative prompt revisions tested across models and test cases.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Create New Prompt Version
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {prompts.map(p => (
          <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-normal" style={{ marginRight: '0.5rem' }}>{p.id}</span>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{p.name}</span>
              </div>
              {prompts.length > 1 && (
                <button
                  className="btn btn-danger"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => handleDelete(p.id)}
                >
                  Delete
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
              <strong>Change Note:</strong> {p.changeNote}
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                System Prompt (Temperature: {p.temperature})
              </div>
              <pre className="code-box" style={{ maxHeight: '180px' }}>{p.systemPrompt || '(Default Assistant)'}</pre>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                User Template
              </div>
              <pre className="code-box" style={{ maxHeight: '100px' }}>{p.userTemplate}</pre>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '600px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create Prompt Version</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Version Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. v4 - Chain of Thought" />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Change Note</label>
                <input type="text" value={changeNote} onChange={e => setChangeNote(e.target.value)} placeholder="Summary of alterations from prior version..." />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Temperature ({temperature})</label>
                <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>System Prompt</label>
                <textarea rows={5} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} placeholder="Persona and instructions..." />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>User Template (Use &#123;email_text&#125; variable)</label>
                <textarea rows={2} value={userTemplate} onChange={e => setUserTemplate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Version</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
