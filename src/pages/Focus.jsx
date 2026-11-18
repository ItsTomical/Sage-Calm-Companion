import { useState, useEffect } from 'react'
import FocusTimer from '../components/focus/FocusTimer.jsx'
import TimerControls from '../components/focus/TimerControls.jsx'
import WorkNotes from '../components/focus/WorkNotes.jsx'
import DistractionLog from '../components/focus/DistractionLog.jsx'
import DurationControl from '../components/focus/DurationControl.jsx'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { COMPACT } from '../utils/breakpoints.js'
import { saySage } from '../components/companion/FloatingSage.jsx'
import { useTimer } from '../hooks/useTimer.js'
import { withName } from '../utils/userName.js'
import { useSageAnimation } from '../hooks/useSageAnimation.js'
import { useTasks, currentStepOf } from '../hooks/useTasks.js'
import './Focus.css'

const clampMinutes = (m) => Math.min(60, Math.max(5, m))
const POMODORO = 25 // minutes: the standard focus round

// What the timer is doing, for the label above it.
function modeLabel({ phase, round, rounds, extended, workMin, breakMin, total }) {
  if (phase === 'break') return `Break · ${breakMin} min`
  if (phase === 'longBreak') return `Long break · ${Math.round(total / 60)} min`
  if (phase === 'finished') return 'Time’s up for this step'
  if (extended) return `A little longer · ${Math.round(total / 60)} min`
  if (rounds > 1) return `Pomodoro ${round} of ${rounds} · ${workMin} min`
  return `Focus · ${workMin} min`
}

export default function Focus() {
  const { activeTask, toggleStep, selectStep, updateStep } = useTasks()
  const isCompact = useMediaQuery(COMPACT)

  const steps = activeTask?.steps ?? []
  const currentStep = currentStepOf(activeTask)

  // The step's own estimate decides the shape of the session. A short step
  // (25 min or less) is one session of its own length, with no breaks. A
  // longer one runs as standard 25-minute Pomodoros with breaks between, as
  // many as it needs. The Focus length setting overrides the default, and
  // the number of rounds follows from it.
  const stepMinutes = parseInt(currentStep?.time) || 15
  const [customWork, setCustomWork] = useState(null)
  const [breakMin, setBreakMin] = useState(5)
  const workMin = customWork ?? clampMinutes(Math.min(stepMinutes, POMODORO))
  const rounds = Math.max(1, Math.ceil(stepMinutes / workMin))
  const sessionNote = rounds > 1
    ? `${rounds} sessions · ${breakMin}-min breaks`
    : `One ${workMin}-min session`

  useEffect(() => {
    setCustomWork(null)
  }, [currentStep?.id])

  const { timeLeft, running, phase, round, extended, sessions, toggle, reset, extend, progress, total } =
    useTimer({ workSeconds: workMin * 60, breakSeconds: breakMin * 60, rounds })
  const label = modeLabel({ phase, round, rounds, extended, workMin, breakMin, total })

  // Sage works while a focus interval is running and rests with her mug
  // while a break is, following the timer itself: paused, finished, reset or
  // leaving the page (which stops the timer) all end the chain through its
  // _out. Done ✓ asks for her completion first (useTasks), so she puts the
  // laptop away and then nods.
  const sage = useSageAnimation()
  const sageChain = !running ? null
    : phase === 'focus' ? 'work'
    : phase === 'break' || phase === 'longBreak' ? 'break'
    : null
  useEffect(() => {
    if (!sageChain) return
    sage.startChain(sageChain)
    return () => sage.stopChain(sageChain)
  }, [sageChain, sage])

  // When the planned time is up: a short step gets five more minutes, a
  // Pomodoro step one more round.
  const moreLabel = rounds > 1 ? 'One more Pomodoro' : '5 more minutes'
  const moreSeconds = rounds > 1 ? workMin * 60 : 5 * 60
  const currentIndex = currentStep ? steps.indexOf(currentStep) : -1
  const upNext = currentIndex >= 0 ? steps.slice(currentIndex + 1).find(s => !s.done) : null
  const doneCount = steps.filter(s => s.done).length
  const remaining = steps.length - doneCount - (currentStep ? 1 : 0)

  // Once the timer has started on a step, or straight away if the step
  // already has work written (coming back to it later), the page is for doing
  // the work: the timer moves into a small bar and the writing area takes the
  // space. Once shown it stays for this step, so clearing the text doesn't
  // whisk it away mid-edit. Reset (on a step with no work yet) or Done brings
  // the big timer back.
  const hasNotes = Boolean(currentStep?.notes?.trim())
  const [keepWorking, setKeepWorking] = useState(false)
  const working = Boolean(currentStep) && (keepWorking || running || timeLeft < total || hasNotes)

  useEffect(() => {
    setKeepWorking(false)
  }, [currentStep?.id])

  useEffect(() => {
    if (working) setKeepWorking(true)
  }, [working])

  function handleReset() {
    reset()
    setKeepWorking(false)
  }

  function handleDone() {
    if (activeTask && currentStep) {
      // The last step finishes the whole task: useTasks says that one (with
      // the confetti), so this line is only for the steps before it.
      const finishesTask = steps.every(s => s.id === currentStep.id || s.done)
      toggleStep(activeTask.id, currentStep.id)
      if (upNext) selectStep(activeTask.id, upNext.id)
      if (!finishesTask) {
        saySage(withName(n => `That's one step down. Well done, ${n}.`, "That's one step down. Well done."))
      }
    }
    reset()
  }

  // Notes and distractions live on the step, so they can be found again
  // beside it on the Tasks page.
  function saveNotes(notes) {
    updateStep(activeTask.id, currentStep.id, { notes })
  }

  function logDistraction(text) {
    const entry = { text, at: new Date().toISOString() }
    updateStep(activeTask.id, currentStep.id, s => ({ distractions: [...(s.distractions ?? []), entry] }))
    saySage("Noted. I'll hold that thought. Back to it later.")
  }

  function removeDistraction(at) {
    updateStep(activeTask.id, currentStep.id, s => ({ distractions: (s.distractions ?? []).filter(d => d.at !== at) }))
  }

  return (
    <div className="focus-page">
      <div className={`focus-layout page-frame${working ? ' is-working' : ''}`}>

        <aside className="focus-sidebar">
          <div className="focus-task-ctx" data-tour="focus-context">
            <div className="focus-task-label">Focusing on</div>
            <div className="focus-task-name">{currentStep?.title || 'No active step'}</div>
            <div className="focus-task-tag">{activeTask?.name || 'Add a task to get started'}</div>
          </div>

          {steps.length > 0 && (
            <div className="session-stats" data-tour="step-progress">
              <div className="session-label">STEP PROGRESS</div>
              <div className="session-row">
                {steps.map((s, i) => (
                  <div
                    key={s.id}
                    className={`session-dot ${s.done ? 'done-s' : i === currentIndex ? 'active-s' : 'empty-s'}`}
                  />
                ))}
              </div>
              <div className="session-note">
                {doneCount} done{currentStep ? ' · 1 in progress' : ''} · {remaining} remaining
              </div>
            </div>
          )}

          <div className="timer-settings" data-tour="timer-settings">
            <div className="section-label">TIMER</div>
            <DurationControl
              label="Focus"
              value={workMin}
              min={5}
              max={60}
              step={5}
              onChange={setCustomWork}
              note={sessionNote}
            />
            <DurationControl
              label="Break"
              value={breakMin}
              min={1}
              max={15}
              step={1}
              onChange={setBreakMin}
            />
          </div>
        </aside>

        <main className={`focus-centre${working ? ' working' : ''}`}>
          <div className="focus-centre-inner">
            {working ? (
              <>
                <div className="focus-bar">
                  <FocusTimer timeLeft={timeLeft} progress={progress} compact />
                  <div className="focus-bar-info">
                    <div className="focus-mode-label">
                      {label}
                    </div>
                    {sessions > 0 && (
                      <div className="fc-sessions">
                        {sessions} focus session{sessions > 1 ? 's' : ''} completed
                      </div>
                    )}
                  </div>
                  <TimerControls
                    running={running}
                    fresh={timeLeft === total}
                    onToggle={toggle}
                    onReset={handleReset}
                    onDone={handleDone}
                    finished={phase === 'finished'}
                    moreLabel={moreLabel}
                    onMore={() => extend(moreSeconds)}
                  />
                </div>
                <WorkNotes step={currentStep} onSave={saveNotes} />
              </>
            ) : (<>
            <div className="focus-mode-label">
              {label}
            </div>
            <FocusTimer timeLeft={timeLeft} progress={progress} />
            <TimerControls
              running={running}
              fresh={timeLeft === total}
              onToggle={toggle}
              onReset={handleReset}
              onDone={handleDone}
              finished={phase === 'finished'}
              moreLabel={moreLabel}
              onMore={() => extend(moreSeconds)}
            />
            {sessions > 0 && (
              <div className="fc-sessions">
                {sessions} focus session{sessions > 1 ? 's' : ''} completed
              </div>
            )}
            {upNext && (
              <div className="focus-next-preview" data-tour="up-next">
                <div className="fn-label">Up next</div>
                <div className="fn-step">{upNext.title}</div>
                <div className="fn-time">{upNext.time} · {remaining} step{remaining === 1 ? '' : 's'} remaining</div>
              </div>
            )}
            </>)}
          </div>
        </main>

        <aside className="focus-right">
          {/* On phones and tablets it waits until work has started: before
              that there's nothing to be distracted from, and the timer
              length belongs next to Start instead. */}
          {(working || !isCompact) && (
            <DistractionLog step={currentStep} onLog={logDistraction} onRemove={removeDistraction} />
          )}
        </aside>

      </div>
    </div>
  )
}
