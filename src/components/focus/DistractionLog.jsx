import { useState } from 'react'
import { formatClock } from '../../utils/formatTime.js'
import './DistractionLog.css'

// Somewhere to put a passing thought without acting on it. Each one is saved
// on the step being worked on, and listed underneath so it's clear Sage is
// holding it. They can all be found again later on the Tasks page.
export default function DistractionLog({ step, onLog, onRemove }) {
  const [text, setText] = useState('')
  const logged = [...(step?.distractions ?? [])].reverse() // newest first

  function log() {
    if (!text.trim()) return
    onLog(text.trim())
    setText('')
  }

  return (
    <div className="distraction-log" data-tour="distraction-log">
      <div className="section-label">DISTRACTION LOG</div>
      <div className="distract-note">Notice an urge to switch tabs?</div>
      <div className="distract-sub">Jot it down here. Sage will hold it for you.</div>

      {step ? (
        <>
          <textarea
            className="distract-ta"
            placeholder="e.g. Check email…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="log-btn" onClick={log}>Log it</button>

          {logged.length > 0 && (
            <div className="dl-list">
              <div className="dl-list-label">Logged for this step</div>
              {logged.map((d) => (
                <div key={d.at} className="dl-item">
                  <span className="dl-time">{formatClock(d.at)}</span>
                  <span className="dl-text">{d.text}</span>
                  <button className="dl-remove" title="Remove" aria-label={`Remove: ${d.text}`} onClick={() => onRemove(d.at)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="dl-none">Pick a step to work on first, and anything you log here will be kept with it.</div>
      )}
    </div>
  )
}
