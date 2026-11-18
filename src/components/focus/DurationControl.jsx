import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { TOUCH } from '../../utils/breakpoints.js'
import './DurationControl.css'

// Setting a length in minutes. A slider with a mouse or trackpad; on touch
// screens a − / + stepper instead, since a thin slider is hard to grab with a
// finger and fights the page's scrolling, while a tap is always exact.
export default function DurationControl({ label, value, min, max, step, onChange, note }) {
  const isTouch = useMediaQuery(TOUCH)

  if (isTouch) {
    return (
      <div className="ts-row" role="group" aria-label={`${label} length`}>
        <div className="ts-label-row">
          <span>{label}</span>
        </div>
        <div className="ts-stepper">
          <button
            className="ts-step"
            aria-label="Shorter"
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - step))}
          >
            −
          </button>
          <span className="ts-value" aria-live="polite">{value} min</span>
          <button
            className="ts-step"
            aria-label="Longer"
            disabled={value >= max}
            onClick={() => onChange(Math.min(max, value + step))}
          >
            +
          </button>
        </div>
        {note && <div className="ts-note">{note}</div>}
      </div>
    )
  }

  return (
    <div className="ts-row">
      <div className="ts-label-row">
        <span>{label}</span>
        <span className="ts-value">{value} min</span>
      </div>
      <input
        type="range"
        className="ts-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} length`}
      />
      {note && <div className="ts-note">{note}</div>}
    </div>
  )
}
