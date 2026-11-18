import Modal from '../ui/Modal.jsx'
import WorkNotes from '../focus/WorkNotes.jsx'
import { formatClock } from '../../utils/formatTime.js'
import './StepLogModal.css'

// Everything written and logged while working on one step, opened from its
// square in the "Work notes & distractions" column on the Tasks page. The
// notes can be added to, edited and copied here; they save as you type, the
// same as on the Focus page.
export default function StepLogModal({ step, onClose, onSaveNotes, onRemoveDistraction }) {
  const distractions = [...(step?.distractions ?? [])].reverse() // newest first

  return (
    <Modal isOpen={Boolean(step)} onBackdrop={onClose}>
      {step && (
        <div className="step-log" onClick={(e) => e.stopPropagation()} aria-labelledby="step-log-title">
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

          <div className="sl-kicker">Step {step.id}</div>
          <h2 className="sl-title" id="step-log-title">{step.title}</h2>

          <div className="section-label">Work notes</div>
          <WorkNotes step={step} onSave={onSaveNotes} compact />

          <div className="section-label sl-gap">Distractions</div>
          {distractions.length > 0 ? (
            <ul className="sl-list">
              {distractions.map((d) => (
                <li key={d.at} className="sl-item">
                  <span className="sl-time">{formatClock(d.at)}</span>
                  <span className="sl-text">{d.text}</span>
                  <button
                    className="sl-remove"
                    title="Remove"
                    aria-label={`Remove: ${d.text}`}
                    onClick={() => onRemoveDistraction(d.at)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sl-empty">No distractions logged for this step.</p>
          )}
        </div>
      )}
    </Modal>
  )
}
