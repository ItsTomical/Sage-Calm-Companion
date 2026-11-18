import { useState } from 'react'
import Panel from '../ui/Panel.jsx'
import flameIcon from '../../assets/icons/flame.png'
import { moodOptions } from '../../data/moods.js'
import { clickable } from '../../utils/a11y.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { COMPACT } from '../../utils/breakpoints.js'
import './MoodPanel.css'

export default function MoodPanel({ selectedMood, onSelectMood, streakData, children }) {
  // On phones and tablets the mood check-in sits beside Today at the top,
  // folded to one line showing the current mood; it opens on a tap and
  // folds again once a mood is picked. Desktop always shows all five.
  const isCompact = useMediaQuery(COMPACT)
  const best = streakData.best ?? streakData.streak
  const [open, setOpen] = useState(false)
  const current = moodOptions.find(m => m.label === selectedMood)

  function pick(label) {
    onSelectMood(label)
    setOpen(false)
  }

  return (
    <div className="right-panel">
      <Panel className={`mp-mood${open ? ' open' : ''}`} data-tour="mood">
        {isCompact ? (
          <button
            className="mood-toggle"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-label={`How are you feeling? ${selectedMood ? `Currently ${selectedMood}` : 'Not chosen yet'}`}
          >
            <span className="mood-toggle-label">Mood</span>
            {current && <img src={current.icon} alt="" className="mood-emoji" />}
            <svg className="mood-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ) : (
          <div className="section-label">HOW ARE YOU FEELING?</div>
        )}
        {(!isCompact || open) && (
        <div className="mood-selector">
          {moodOptions.map((m) => (
            <div
              key={m.label}
              className={`mood-btn${selectedMood === m.label ? ' selected' : ''}`}
              aria-pressed={selectedMood === m.label}
              {...clickable(() => pick(m.label))}
            >
              <img src={m.icon} alt="" className="mood-emoji" />
              <div className="mood-word">{m.label}</div>
            </div>
          ))}
        </div>
        )}
      </Panel>

      <Panel className="mp-streak" data-tour="streak">
        <div className="section-label">STREAK</div>
        <div className="streak-display">
          <div>
            <div className="streak-num">{streakData.streak}</div>
            <div className="streak-label">day streak <img src={flameIcon} alt="" className="streak-flame" /></div>
            <div className="streak-sub">Personal best: {best} {best === 1 ? 'day' : 'days'}</div>
          </div>
        </div>
        <div className="week-row">
          {streakData.weekDays.map((d, i) => (
            <div
              key={i}
              className={`week-dot ${d.done ? 'done-w' : ''} ${d.today ? 'today-w' : ''} ${!d.done && !d.today ? 'empty-w' : ''}`}
            >
              {d.label}
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="mp-focus" data-tour="focus-today">
        <div className="section-label">FOCUS TODAY</div>
        <div className="focus-today">
          <span className="focus-num">{streakData.focusNum ?? '0'}</span>
          <span className="focus-lbl">{streakData.focusLbl ?? 'min focused'}</span>
        </div>
        <div className="mini-bars">
          {streakData.weekBars.map((b, i) => (
            <div
              key={i}
              className={`mini-bar${b.today ? ' today-bar' : ''}`}
              style={{ height: `${b.height * 0.4}px` }}
            />
          ))}
        </div>
      </Panel>

      {/* Sage's nudge card, passed in by the Dashboard. */}
      {children}
    </div>
  )
}
