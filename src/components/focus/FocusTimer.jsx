import { formatTime } from '../../utils/formatTime.js'
import './FocusTimer.css'

const CIRC = 2 * Math.PI * 100

// compact: the small ring used in the bar once work has started.
export default function FocusTimer({ timeLeft, progress, compact = false }) {
  const dashOffset = CIRC * (1 - progress)

  return (
    <div className={`timer-wrap${compact ? ' compact' : ''}`} data-tour="timer">
      <svg className="timer-svg" viewBox="0 0 220 220">
        <circle className="t-track" cx="110" cy="110" r="100" />
        <circle
          className="t-fill"
          cx="110"
          cy="110"
          r="100"
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="breathe-aura" />
      <div className="timer-inner">
        <div className="timer-num">{formatTime(timeLeft)}</div>
        <div className="timer-sub">remaining</div>
      </div>
    </div>
  )
}
