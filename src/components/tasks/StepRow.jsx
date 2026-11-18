import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clickable } from '../../utils/a11y.js'
import './StepRow.css'

export default function StepRow({ step, isCurrent, onToggle, onExpand, onStart, onEdit, onDelete, onOpenLog, expanding }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const navigate = useNavigate()

  function startEdit(e) {
    e.stopPropagation()
    setDraft({ title: step.title, desc: step.desc, time: step.time })
    setEditing(true)
    setOpen(false)
  }

  function saveEdit(e) {
    e.stopPropagation()
    const minutes = parseInt(draft.time) || 15
    onEdit(step, {
      title: draft.title.trim() || step.title,
      desc: draft.desc.trim(),
      detail: draft.desc.trim(),
      time: `${minutes} min`,
    })
    setEditing(false)
  }

  const distractionCount = step.distractions?.length ?? 0
  const notes = step.notes?.trim()
  const hasLog = Boolean(notes) || distractionCount > 0

  const main = editing ? (
    <div className="step-row editing">
      <div className={`step-num${step.done ? ' s-done' : isCurrent ? ' s-lav' : ''}`}>
        {step.done ? '✓' : step.id}
      </div>
      <div className="step-body">
        <input
          className="se-input se-title"
          value={draft.title}
          onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
          placeholder="Step title"
          autoFocus
        />
        <textarea
          className="se-input se-desc"
          rows={2}
          value={draft.desc}
          onChange={(e) => setDraft(d => ({ ...d, desc: e.target.value }))}
          placeholder="Short description"
        />
        <div className="step-footer">
          <input
            className="se-input se-time"
            value={draft.time}
            onChange={(e) => setDraft(d => ({ ...d, time: e.target.value }))}
            placeholder="20 min"
          />
          <div className="step-btns">
            <button className="se-btn se-delete" onClick={(e) => { e.stopPropagation(); onDelete(step) }}>Delete</button>
            <button className="se-btn" onClick={(e) => { e.stopPropagation(); setEditing(false) }}>Cancel</button>
            <button className="se-btn se-save" onClick={saveEdit}>Save</button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <>
      <div className={`step-row${open ? ' open' : ''}`} aria-expanded={open} {...clickable(() => setOpen(o => !o))}>
        <div
          className={`step-num${step.done ? ' s-done' : isCurrent ? ' s-lav' : ''}`}
          title={step.done ? 'Mark as not done' : 'Mark as done'}
          aria-label={step.done ? 'Mark as not done' : 'Mark as done'}
          {...clickable((e) => { e.stopPropagation(); onToggle(step) })}
        >
          {step.done ? '✓' : step.id}
        </div>
        <div className="step-body">
          <div className={`step-title-t${step.done ? ' step-done-title' : ''}`}>{step.title}</div>
          <div className="step-desc-t">{step.desc}</div>
          <div className="step-footer">
            <span className="step-time">{step.time}</span>
            <div className="step-btns">
              <button className="step-edit-btn" onClick={startEdit}>Edit</button>
              {step.expandable && !step.done && (
                <button
                  className="step-expand-btn"
                  disabled={expanding}
                  onClick={(e) => { e.stopPropagation(); onExpand(step) }}
                >
                  {expanding ? 'Breaking down…' : 'Break down'}
                </button>
              )}
              <button
                className="step-start-btn"
                onClick={(e) => { e.stopPropagation(); onStart?.(step); navigate('/focus') }}
              >
                Start
              </button>
            </div>
          </div>
        </div>
        <div className="step-chevron">›</div>
      </div>
      {open && <div className="step-detail">{step.detail}</div>}
    </>
  )

  // Two columns: the step, and beside it a square for whatever was written
  // and logged while working on it (saved from the Focus page). Sharing a
  // row keeps the square level with its step at any height or scroll.
  return (
    <div className="step-line">
      <div className="step-main">{main}</div>
      <div className="step-log-cell">
        {hasLog && (
          <button
            className="step-log-tile"
            onClick={() => onOpenLog(step)}
            aria-label={`Work notes and distractions for step ${step.id}`}
          >
            <span className="slt-head">
              Step {step.id}
              <span className="slt-chev" aria-hidden="true">›</span>
            </span>
            {notes && <span className="slt-notes">{notes.split('\n')[0]}</span>}
            {distractionCount > 0 && (
              <span className="slt-count">
                {distractionCount} distraction{distractionCount === 1 ? '' : 's'}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
