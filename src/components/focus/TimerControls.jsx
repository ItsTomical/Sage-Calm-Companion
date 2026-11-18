import { useNavigate } from 'react-router-dom'
import './TimerControls.css'

// finished: the step's planned time is up. Sage asks "Done, or a little
// longer?", so the buttons become exactly those two choices.
export default function TimerControls({ running, fresh, onToggle, onReset, onDone, finished = false, moreLabel, onMore }) {
  const navigate = useNavigate()

  if (finished) {
    return (
      <div className="focus-controls" data-tour="timer-controls">
        <button className="fc-btn primary" onClick={() => { onDone?.(); navigate('/dashboard') }}>
          Done ✓
        </button>
        <button className="fc-btn ghost" onClick={onMore}>{moreLabel}</button>
      </div>
    )
  }

  return (
    <div className="focus-controls" data-tour="timer-controls">
      <button className="fc-btn primary" id="f-btn" onClick={onToggle}>
        {running ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
            Pause
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {fresh ? 'Start' : 'Resume'}
          </>
        )}
      </button>
      <button className="fc-btn ghost" onClick={onReset}>Reset</button>
      <button
        className="fc-btn ghost"
        onClick={() => { onDone?.(); navigate('/dashboard') }}
      >
        Done ✓
      </button>
    </div>
  )
}
