import { useEffect, useRef, useState } from 'react'
import { moodOptions } from '../../data/moods.js'
import { WRITE_IDLE_TIMEOUT_MS } from '../../data/sageClips.js'
import { saveTodayMood } from '../../hooks/useMood.js'
import { useSageAnimation } from '../../hooks/useSageAnimation.js'
import './MoodReflection.css'

// The mood and the chosen prompt live on the Reflect page, because the prompt
// list beside this card reorders with the mood. The note stays here.
export default function MoodReflection({ mood, onMoodChange, prompt, onClearPrompt, onSave }) {
  const [note, setNote] = useState('')
  const [needsMood, setNeedsMood] = useState(false)
  const noteRef = useRef(null)
  const sage = useSageAnimation()
  const quietTimer = useRef(null)

  // Sage writes along while they type: the write chain starts with the
  // first keystroke and ends (notepad away) after WRITE_IDLE_TIMEOUT_MS
  // without one, on save, or when they leave the page.
  function stopWriting() {
    clearTimeout(quietTimer.current)
    sage.stopChain('write')
  }

  function onType(value) {
    setNote(value)
    sage.startChain('write')
    clearTimeout(quietTimer.current)
    quietTimer.current = setTimeout(stopWriting, WRITE_IDLE_TIMEOUT_MS)
  }

  useEffect(() => stopWriting, [])

  function chooseMood(label) {
    onMoodChange(label)
    setNeedsMood(false)
    // Counts as today's mood everywhere (check-ins use it), and Sage reacts.
    // Mid-writing she puts the notepad away first; the next keystroke starts
    // her writing again.
    saveTodayMood(label)
    clearTimeout(quietTimer.current)
    sage.react(label)
  }

  // The × disappears once the prompt is gone, so focus would otherwise drop
  // to the top of the page. The note is where the person was heading anyway.
  function clearPrompt() {
    onClearPrompt()
    noteRef.current?.focus()
  }

  const handleSave = () => {
    // Without a mood nothing is saved, so say so: a save that did nothing
    // silently would leave them with no way to know why.
    if (!mood) {
      setNeedsMood(true)
      return
    }
    onSave({ mood, note, prompt })
    setNote('')
    setNeedsMood(false)
    stopWriting()
  }

  return (
    <div className="mood-card" data-tour="reflection-form">
      <div className="section-label">TODAY'S REFLECTION</div>
      {/* Asked above the faces, so it's clear one is meant to be chosen. */}
      <div className="ref-note-lbl">How are you feeling?</div>
      <div className="mood-big-row">
        {moodOptions.map((m) => (
          <button
            type="button"
            key={m.label}
            className={`mood-opt${mood === m.label ? ' sel' : ''}`}
            aria-pressed={mood === m.label}
            onClick={() => chooseMood(m.label)}
          >
            <img src={m.icon} alt="" className="mo-em" />
            <span className="mo-lbl">{m.label}</span>
          </button>
        ))}
      </div>
      {needsMood && (
        <div className="mood-hint">Choose how you're feeling to save this.</div>
      )}
      {/* A chosen prompt is asked here rather than pasted into the note, so
          nothing already written is ever lost. The note is never touched by
          choosing, changing or removing one. */}
      <div className="ref-question">
        <div id="ref-question" className={`ref-note-lbl${prompt ? ' ref-note-prompt' : ''}`}>
          {prompt || "What's on your mind?"}
        </div>
        {prompt && (
          <button
            type="button"
            className="ref-prompt-clear"
            aria-label="Remove prompt"
            onClick={clearPrompt}
          >
            ×
          </button>
        )}
      </div>
      <textarea
        ref={noteRef}
        className="ref-ta"
        aria-labelledby="ref-question"
        placeholder="Jot down a thought, feeling, or small win…"
        value={note}
        onChange={(e) => onType(e.target.value)}
      />
      <button className="save-ref-btn" onClick={handleSave}>
        Save reflection
      </button>
    </div>
  )
}
