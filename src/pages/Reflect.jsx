import { useState } from 'react'
import MoodReflection from '../components/reflect/MoodReflection.jsx'
import ReflectionHistory from '../components/reflect/ReflectionHistory.jsx'
import { saySage } from '../components/companion/FloatingSage.jsx'
import { withName } from '../utils/userName.js'
import { useReflections } from '../hooks/useReflections.js'
import { moodIcon } from '../data/moods.js'
import { promptsForMood } from '../data/reflectionPrompts.js'
import flameIcon from '../assets/icons/flame.png'
import heartIcon from '../assets/icons/heart.png'
import './Reflect.css'

export default function Reflect() {
  const {
    reflections,
    addReflection,
    updateReflection,
    deleteReflection,
    streak,
    best,
    weekDays,
  } = useReflections()
  // Held here rather than in the reflection card so the prompt list can
  // reorder with the mood. A chosen prompt stays chosen even when the new
  // mood's list doesn't include it; it only goes when they remove it or save.
  const [mood, setMood] = useState(null)
  const [prompt, setPrompt] = useState(null)
  const prompts = promptsForMood(mood)

  function togglePrompt(p) {
    setPrompt(current => (current === p ? null : p))
  }

  function handleSave(entry) {
    addReflection(entry)
    setMood(null)
    setPrompt(null)
    saySage(withName(
      n => `Saved, ${n}. Taking a moment to reflect is its own kind of progress.`,
      'Saved. Taking a moment to reflect is its own kind of progress.',
    ))
  }

  // Praise is held back until three consecutive days. One day is an entry
  // rather than a streak, and two could be coincidence; calling either of
  // them rare would be the same empty encouragement the app avoids
  // everywhere else. Below three the card states the fact and stops.
  const insight =
    streak >= 3
      ? `You've reflected ${streak} days in a row. That level of self-awareness is genuinely rare. Keep going.`
      : streak === 2
        ? "Two days in a row. It's starting to stick."
        : 'You reflected today. That’s the part most people skip.'

  return (
    <div className="reflect-page">
      <div className="reflect-layout page-frame">

        <aside className="reflect-left">
          <div className="streak-reflect-card" data-tour="reflection-streak">
            <div className="section-label">REFLECTION STREAK</div>
            <div className="streak-display">
              <div>
                <div className="streak-num">{streak}</div>
                <div className="streak-label">day streak <img src={flameIcon} alt="" className="streak-flame" /></div>
                <div className="streak-sub">Personal best: {best} {best === 1 ? 'day' : 'days'}</div>
              </div>
            </div>
            <div className="week-row">
              {weekDays.map((d, i) => (
                <div
                  key={i}
                  className={`week-dot ${d.done ? 'done-w' : ''} ${d.today ? 'today-w' : ''} ${!d.done && !d.today ? 'empty-w' : ''}`}
                >
                  {d.label}
                </div>
              ))}
            </div>
          </div>

          <div className="mood-summary-card" data-tour="week-moods">
            <div className="section-label">THIS WEEK'S MOODS</div>
            <div className="mood-trend">
              {weekDays.map((d, i) => {
                const icon = d.mood ? moodIcon(d.mood) : null
                return (
                  <div key={i} className="mood-trend-item">
                    {icon
                      ? <img src={icon} alt={d.mood} className="mt-em" />
                      : <div className="mt-none" title="No reflection" />}
                    <div className={`mt-day${d.today ? ' mt-today' : ''}`}>{d.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="reflect-centre">
          <MoodReflection
            mood={mood}
            onMoodChange={setMood}
            prompt={prompt}
            onClearPrompt={() => setPrompt(null)}
            onSave={handleSave}
          />
          <ReflectionHistory
            entries={reflections}
            onEdit={(entry, patch) => updateReflection(entry.id, patch)}
            onDelete={(entry) => deleteReflection(entry.id)}
          />
        </main>

        <aside className="reflect-right">
          <div className="section-label">PROMPTS</div>
          <div className="prompts-hint">Tap one and it becomes the question above your note.</div>
          <div className="reflect-prompts" data-tour="prompts">
            {prompts.map((p) => (
              <button
                type="button"
                key={p}
                className={`prompt-chip${prompt === p ? ' sel' : ''}`}
                aria-pressed={prompt === p}
                onClick={() => togglePrompt(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {streak > 0 && (
            <>
              <div className="section-label" style={{ marginTop: 24 }}>SAGE INSIGHT</div>
              <div className="sage-insight-card" data-tour="sage-insight">
                <img src={heartIcon} alt="" className="si-emoji" />
                <div className="si-text">{insight}</div>
              </div>
            </>
          )}
        </aside>

      </div>
    </div>
  )
}
