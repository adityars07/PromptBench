import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, CheckIcon } from './Icons';
import { PromptVersion } from '../types';

interface PromptsViewProps {
  prompts: PromptVersion[];
  onSavePrompt: (prompt: PromptVersion) => void;
  onCreateNewPrompt: () => void;
  onDuplicatePrompt: (basePrompt: PromptVersion) => void;
}

export const PromptsView: React.FC<PromptsViewProps> = ({
  prompts,
  onSavePrompt,
  onCreateNewPrompt,
  onDuplicatePrompt
}) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>('v3');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Form state for current selected prompt
  const currentPrompt = prompts.find(p => p.id === selectedId) || prompts[0] || {
    id: 'v3',
    name: 'v3 · Few-shot with strict JSON',
    title: 'v3',
    subtitle: 'Few-shot with strict JSON',
    temperature: 0.2,
    tempLabel: 'temp 0.2',
    changeNote: 'Added 2 graded examples and set temperature to 0.2, because the JSON still broke in v2.',
    systemPrompt:
      'You are a customer support triage assistant.\nReturn only valid JSON with the keys: issue, urgency (low, medium or high) and suggested_action.\nDo not add any text outside the JSON.',
    userTemplate: 'Summarise the email below into the JSON format.\n\nEmail:\n{email}',
    examplesCount: 2
  };

  const [formChangeNote, setFormChangeNote] = useState(currentPrompt.changeNote);
  const [formSystemPrompt, setFormSystemPrompt] = useState(currentPrompt.systemPrompt);
  const [formUserTemplate, setFormUserTemplate] = useState(currentPrompt.userTemplate);
  const [formTemperature, setFormTemperature] = useState(currentPrompt.temperature);

  // Update form fields when user clicks another version card
  const handleSelectVersion = (p: PromptVersion) => {
    setSelectedId(p.id);
    setFormChangeNote(p.changeNote);
    setFormSystemPrompt(p.systemPrompt);
    setFormUserTemplate(p.userTemplate);
    setFormTemperature(p.temperature);
  };

  const handleSave = () => {
    const updated: PromptVersion = {
      ...currentPrompt,
      changeNote: formChangeNote,
      systemPrompt: formSystemPrompt,
      userTemplate: formUserTemplate,
      temperature: formTemperature,
      tempLabel: formTemperature === 0.2 ? 'temp 0.2' : formTemperature === 0.7 ? 'temp default' : `temp ${formTemperature}`
    };
    onSavePrompt(updated);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const handleDuplicate = () => {
    onDuplicatePrompt(currentPrompt);
  };

  const handleRunThis = () => {
    navigate('/run');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Prompts</h1>
          <p className="page-subtitle">Write and version the prompts you want to compare</p>
        </div>
        <button
          onClick={onCreateNewPrompt}
          className="btn btn-primary"
          aria-label="Create new prompt version"
        >
          <PlusIcon />
          <span>New version</span>
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="prompts-layout">
        {/* Left Column: Version Cards */}
        <div className="prompt-version-list" aria-label="Prompt version choices">
          {prompts.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <div
                key={p.id}
                className={`prompt-version-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectVersion(p)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="version-card-header">
                  <span className="version-card-name">{p.title}</span>
                  <span className="version-card-temp">{p.tempLabel}</span>
                </div>
                <div className="version-card-desc">{p.subtitle}</div>
                <div className="version-card-note">{p.changeNote}</div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Editor Card */}
        <div className="editor-card" aria-label="Prompt version editor">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title" style={{ fontSize: '18px' }}>
              {currentPrompt.title} · {currentPrompt.subtitle}
            </h2>
            <span className="chip chip-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {isSavedFeedback && <CheckIcon size={12} />}
              Saved
            </span>
          </div>

          {/* What changed and why */}
          <div className="editor-field">
            <label className="editor-label" htmlFor="prompt-change-note">
              What changed and why
            </label>
            <textarea
              id="prompt-change-note"
              rows={2}
              value={formChangeNote}
              onChange={e => setFormChangeNote(e.target.value)}
              placeholder="Explain the changes in this version..."
            />
          </div>

          {/* System prompt */}
          <div className="editor-field">
            <label className="editor-label" htmlFor="prompt-system-prompt">
              System prompt
            </label>
            <textarea
              id="prompt-system-prompt"
              rows={4}
              className="monospace"
              value={formSystemPrompt}
              onChange={e => setFormSystemPrompt(e.target.value)}
              placeholder="System prompt instructions..."
            />
          </div>

          {/* User prompt template */}
          <div className="editor-field">
            <label className="editor-label" htmlFor="prompt-user-template">
              User prompt template
            </label>
            <textarea
              id="prompt-user-template"
              rows={5}
              className="monospace"
              value={formUserTemplate}
              onChange={e => setFormUserTemplate(e.target.value)}
              placeholder="Prompt template with {email} variable..."
            />
          </div>

          {/* Variables row */}
          <div className="editor-field">
            <span className="editor-label">Variables</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
              <span className="chip chip-indigo" style={{ fontFamily: 'var(--font-mono)' }}>
                &#123;email&#125;
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                The raw customer email text
              </span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="editor-field" style={{ maxWidth: '340px' }}>
            <div className="slider-header" style={{ marginBottom: '6px' }}>
              <span className="editor-label" style={{ fontSize: '13px' }}>
                Temperature: {formTemperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formTemperature}
              onChange={e => setFormTemperature(parseFloat(e.target.value))}
              aria-label="Prompt temperature"
            />
          </div>

          {/* Examples count */}
          <div className="editor-field">
            <span className="editor-label" style={{ fontSize: '13px' }}>Examples included</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentPrompt.examplesCount ?? (currentPrompt.id === 'v3' ? 2 : 0)}
            </span>
          </div>

          {/* Buttons footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              aria-label="Save prompt version changes"
            >
              Save version
            </button>
            <button
              onClick={handleDuplicate}
              className="btn btn-secondary"
              aria-label="Duplicate prompt as new version"
            >
              Duplicate as v{prompts.length + 1}
            </button>
            <button
              onClick={handleRunThis}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-indigo)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0 8px',
                textDecoration: 'none'
              }}
            >
              Run this version →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
