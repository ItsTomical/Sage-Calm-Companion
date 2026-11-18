import { useState, useEffect, useRef } from 'react'
import Button from './Button.jsx'
import { BREATHING_COUNTDOWN_SECONDS } from '../../data/sageClips.js'
import { useSageAnimation } from '../../hooks/useSageAnimation.js'
import './BreathingCircle.css'

// Box breathing: in, hold, out, hold, four seconds each. The circle grows on
// the in-breath, rests, shrinks on the out-breath, rests, and the words
// inside say which part you're on.
//
// Nothing starts by itself. They choose a length, taking as long as they
// like, then press Begin; a calm countdown follows (the length is fixed from
// then on), and the breathing starts when it reaches zero. Sage breathes
// along: her 16-second breathing clip is the same in-hold-out-hold, started
// at the first "Breathe in" and held to this exercise's clock.
const PHASES = [
  { label: 'Breathe in',  big: true },
  { label: 'Hold',        big: true },
  { label: 'Breathe out', big: false },
  { label: 'Hold',        big: false },
]
const SECONDS = 4
const ROUND = PHASES.length * SECONDS // 16s

// How long to keep going, chosen by how it feels rather than by a number.
const LENGTHS = [
  { rounds: 4,  minutes: 1, label: 'Quick reset' },
  { rounds: 8,  minutes: 2, label: 'Overwhelmed' },
  { rounds: 12, minutes: 3, label: 'Frozen' },
]

// The progress ring around the circle (SVG units, drawn in a 200 box).
const RING_RADIUS = 98
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

const FRESH = { phase: 0, count: SECONDS, elapsed: 0 }

// stage: 'choosing' → (Begin) 'countdown' → 'breathing' → 'finished'.
// `again`: bump it to go back to choosing for another session (the modal's
// "I need a little more time").
export default function BreathingCircle({ onFinishedChange, again = 0 }) {
  const sage = useSageAnimation()
  const [lengthIndex, setLengthIndex] = useState(0)
  const [stage, setStage] = useState('choosing')
  const [startsIn, setStartsIn] = useState(BREATHING_COUNTDOWN_SECONDS)
  const [started, setStarted] = useState(false) // the circle has begun moving
  const [{ phase, count, elapsed }, setTick] = useState(FRESH)
  const optionRefs = useRef([])
  const beginRef = useRef(null)

  const rounds = LENGTHS[lengthIndex].rounds
  const locked = stage === 'countdown' || stage === 'breathing'

  // The countdown after Begin, then the breathing itself.
  useEffect(() => {
    if (stage !== 'countdown') return
    if (startsIn <= 0) {
      setTick(FRESH)
      setStage('breathing')
      return
    }
    const timer = setTimeout(() => setStartsIn(n => n - 1), 1000)
    return () => clearTimeout(timer)
  }, [stage, startsIn])

  useEffect(() => {
    if (stage !== 'breathing') return

    // The first "Breathe in" is on screen now: Sage starts breathing with it.
    sage.startBreathing()

    // Wait for the small circle to be drawn before asking it to grow, or the
    // very first in-breath would jump straight to full size.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setStarted(true))
    })

    // JS only keeps time and switches phase; the growing and shrinking is a
    // CSS transition the same length as a phase, so the two stay in step.
    const timer = setInterval(() => {
      setTick(t =>
        t.count > 1
          ? { ...t, count: t.count - 1, elapsed: t.elapsed + 1 }
          : { phase: (t.phase + 1) % PHASES.length, count: SECONDS, elapsed: t.elapsed + 1 }
      )
    }, 1000)

    return () => {
      cancelAnimationFrame(frame)
      clearInterval(timer)
      // Finished, closed (× or "I feel ready") or gone: she settles again.
      sage.stopBreathing()
    }
  }, [stage, sage])

  // Sage's clip is kept on this clock, so the two never drift apart.
  useEffect(() => {
    if (stage === 'breathing') sage.syncBreathing(elapsed)
  }, [elapsed, stage, sage])

  // Only ever finish as a round completes (after the out-breath and its
  // hold), never mid-breath.
  useEffect(() => {
    const roundJustEnded = elapsed > 0 && elapsed % ROUND === 0
    if (stage === 'breathing' && roundJustEnded && elapsed / ROUND >= rounds) {
      setStage('finished')
      onFinishedChange?.(true)
    }
  }, [elapsed, rounds, stage])

  function backToChoosing() {
    setTick(FRESH)
    setStarted(false)
    setStartsIn(BREATHING_COUNTDOWN_SECONDS)
    setStage('choosing')
    onFinishedChange?.(false)
  }

  useEffect(() => {
    if (!again) return
    backToChoosing()
    // "I need a little more time" has gone; Begin is the thing to press now.
    requestAnimationFrame(() => beginRef.current?.querySelector('button')?.focus())
  }, [again])

  function begin() {
    setStartsIn(BREATHING_COUNTDOWN_SECONDS)
    setStage('countdown')
    // Begin goes away; keep keyboard focus in the card, on the length chosen.
    optionRefs.current[lengthIndex]?.focus()
  }

  // Once the countdown has begun the length is fixed. After finishing,
  // picking one sets up a new session, which waits for Begin again.
  function choose(index) {
    if (locked) return
    setLengthIndex(index)
    if (stage === 'finished') backToChoosing()
  }

  // Arrow keys move between the options, as in any radio group.
  function onPickerKey(e) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step || locked) return
    e.preventDefault()
    const next = (lengthIndex + step + LENGTHS.length) % LENGTHS.length
    choose(next)
    optionRefs.current[next]?.focus()
  }

  const finished = stage === 'finished'
  const breathing = stage === 'breathing'
  const progress = finished ? 1 : breathing ? Math.min(elapsed / (rounds * ROUND), 1) : 0
  const current = PHASES[phase]

  let label
  let shownCount = null
  if (stage === 'choosing') label = 'Ready when you are'
  else if (stage === 'countdown') {
    label = 'Starting in'
    shownCount = Math.max(startsIn, 1)
  } else if (breathing) {
    label = current.label
    shownCount = count
  } else label = 'Well done'

  return (
    <>
      <div className="bc-stage">
        <svg className="bc-ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="bc-ring-track" cx="100" cy="100" r={RING_RADIUS} />
          <circle
            className="bc-ring-fill"
            cx="100"
            cy="100"
            r={RING_RADIUS}
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - progress)}
          />
        </svg>
        <div className={`bc-circle${breathing && started && current.big ? ' big' : ''}`} />
        <div className="bc-words">
          {/* Announced to screen readers as it changes; the count isn't, so
              they aren't read a number every second. */}
          <div aria-live="polite">
            <span key={breathing ? phase : stage} className={`bc-label${stage === 'choosing' ? ' bc-label-small' : ''}`}>
              {label}
            </span>
          </div>
          {shownCount !== null && <span className="bc-count" aria-hidden="true">{shownCount}</span>}
        </div>
      </div>

      <div
        className={`bc-lengths${locked ? ' locked' : ''}`}
        role="radiogroup"
        aria-label="How long to breathe"
        onKeyDown={onPickerKey}
      >
        {LENGTHS.map((length, i) => (
          <button
            key={length.label}
            ref={el => { optionRefs.current[i] = el }}
            className="bc-length"
            role="radio"
            aria-checked={i === lengthIndex}
            tabIndex={i === lengthIndex ? 0 : -1}
            aria-disabled={locked || undefined}
            onClick={() => choose(i)}
          >
            <span className="bc-length-min">{length.minutes} min</span>
            <span className="bc-length-label">{length.label}</span>
          </button>
        ))}
      </div>

      {/* The main action while choosing. The modal focuses it as it opens
          (data-autofocus), and it's focused again on coming back to choose
          for another session. */}
      {stage === 'choosing' && (
        <div className="bc-begin" ref={beginRef}>
          <Button onClick={begin} data-autofocus>Begin</Button>
        </div>
      )}
    </>
  )
}
