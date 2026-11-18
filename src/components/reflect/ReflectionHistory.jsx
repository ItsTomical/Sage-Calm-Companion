import { useState } from 'react'
import { moodOptions, moodIcon } from '../../data/moods.js'
import './ReflectionHistory.css'

// One past entry. Holds its own edit state, the same way a step row does.
function ReflectionEntry({ entry, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)

  function startEdit() {
    setDraft({ moodLabel: entry.moodLabel, note: entry.note })
    setEditing(true)
  }

  function saveEdit() {
    onEdit(entry, {
      moodLabel: draft.moodLabel,
      note: draft.note.trim(),
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="ref-entry ref-editing">
        <div className="ref-date-col">
          <div className="ref-day">{entry.day}</div>
          <div className="ref-mon">{entry.month}</div>
        </div>
        <div className="ref-body">
          <div className="ref-mood-edit">
            {moodOptions.map((m) => (
              <button
                key={m.label}
                className={`ref-mood-opt${draft.moodLabel === m.label ? ' sel' : ''}`}
                title={m.label}
                onClick={() => setDraft(d => ({ ...d, moodLabel: m.label }))}
              >
                <img src={m.icon} alt={m.label} />
              </button>
            ))}
          </div>
          {/* The question isn't editable: the note was written as its answer.
              Saving only patches mood and note, so the prompt is kept. */}
          {entry.prompt && (
            <div id={`ref-prompt-${entry.id}`} className="ref-prompt">{entry.prompt}</div>
          )}
          <textarea
            className="se-input se-desc"
            rows={3}
            value={draft.note}
            onChange={(e) => setDraft(d => ({ ...d, note: e.target.value }))}
            placeholder="What's on your mind?"
            aria-labelledby={entry.prompt ? `ref-prompt-${entry.id}` : undefined}
            autoFocus
          />
          <div className="step-btns">
            <button className="se-btn se-delete" onClick={() => onDelete(entry)}>Delete</button>
            <button className="se-btn" onClick={() => setEditing(false)}>Cancel</button>
            <button className="se-btn se-save" onClick={saveEdit}>Save</button>
          </div>
        </div>
      </div>
    )
  }

  // Same icon set as the mood pickers. Older entries without a
  // recognised label simply show the label on its own.
  const icon = moodIcon(entry.moodLabel)

  return (
    <div className="ref-entry">
      <div className="ref-date-col">
        <div className="ref-day">{entry.day}</div>
        <div className="ref-mon">{entry.month}</div>
      </div>
      <div className="ref-body">
        <div className="ref-mood-row">
          {icon && <img src={icon} alt="" className="ref-mood-em" />}
          <span className="ref-mood-lbl">{entry.moodLabel}</span>
        </div>
        {/* Only entries saved with a prompt have one. Older notes that begin
            with a pasted prompt are shown as written, not split apart. */}
        {entry.prompt && <div className="ref-prompt">{entry.prompt}</div>}
        {(entry.note || !entry.prompt) && <div className="ref-note-text">{entry.note}</div>}
      </div>
      <div className="ref-actions">
        <button className="step-edit-btn" onClick={startEdit}>Edit</button>
        <button className="ref-delete" title="Remove reflection" onClick={() => onDelete(entry)}>×</button>
      </div>
    </div>
  )
}

export default function ReflectionHistory({ entries, onEdit, onDelete }) {
  return (
    <div className="past-card" data-tour="reflection-history">
      <div className="section-label">PAST REFLECTIONS</div>
      <div className="ref-scroll">
      {entries.length === 0 && (
        <p className="ref-empty">Your reflections will appear here once you save one.</p>
      )}
      {entries.map((entry) => (
        <ReflectionEntry
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      </div>
    </div>
  )
}
