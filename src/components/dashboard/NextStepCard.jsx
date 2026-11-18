import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import BreathingCircle from '../ui/BreathingCircle.jsx'
import SageMark from '../companion/SageMark.jsx'
import SageFigure from '../companion/SageFigure.jsx'
import './NextStepCard.css'

function BreathModal({ isOpen, onClose }) {
  // The circle says when the breathing is done; the message and buttons
  // follow it.
  const [finished, setFinished] = useState(false)
  const [again, setAgain] = useState(0)
  const feelReadyRef = useRef(null)

  // Once the breathing is done, "I feel ready" is the natural next step, so
  // it becomes the main button and takes focus.
  useEffect(() => {
    if (finished) feelReadyRef.current?.focus()
  }, [finished])

  useEffect(() => {
    if (isOpen) setFinished(false)
    // Sage is here in the card, so the floating one steps aside.
    window.dispatchEvent(new CustomEvent('sage-elsewhere', { detail: isOpen }))
    // If the card goes away while open (leaving the page), bring her back.
    return () => window.dispatchEvent(new CustomEvent('sage-elsewhere', { detail: false }))
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onBackdrop={onClose}>
      <div className="intervention" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="intervention-companion">
          <SageFigure size={88} float />
        </div>
        <div className="intervention-msg">
          {finished ? 'Nicely done. Whenever you’re ready.' : 'Let’s take a slow breath together before we begin.'}
        </div>
        <BreathingCircle onFinishedChange={setFinished} again={again} />
        <div className="intervention-actions">
          {/* Always there, so they can stop at any point. Quiet while they're
              choosing (Begin leads) and breathing (the circle leads); the main
              button again once it's finished. */}
          <button
            ref={feelReadyRef}
            className={finished ? 'btn-feel-ready' : 'btn-feel-ready-quiet'}
            onClick={onClose}
          >
            I feel ready
          </button>
          {/* Only once a round of breathing is over: mid-way you're already
              breathing, and the length picker covers wanting longer. */}
          {finished && (
            <button className="btn-more-time" onClick={() => setAgain(n => n + 1)}>
              I need a little more time
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

const NOT_READY_MSG = 'That’s okay. We can make this smaller, or just take a breath together first.'

// onBreakDown: breaks this step into smaller ones and resolves to
// { status: 'success' | 'small' | 'error', message? } (see Dashboard).
export default function NextStepCard({ task, step, onBreakDown }) {
  const [showNotReady, setShowNotReady] = useState(false)
  const [showBreath, setShowBreath] = useState(false)
  // What Sage says in the "not ready" panel, and whether breaking down is
  // still on offer. Both reset when the step changes.
  const [notReadyMsg, setNotReadyMsg] = useState(NOT_READY_MSG)
  const [canBreakDown, setCanBreakDown] = useState(true)
  const [breaking, setBreaking] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setNotReadyMsg(NOT_READY_MSG)
    setCanBreakDown(true)
  }, [step?.id, task?.id])

  async function breakDown() {
    setBreaking(true)
    const outcome = await onBreakDown()
    setBreaking(false)
    if (outcome.status === 'success') {
      // The card now shows the first smaller step; the panel's job is done.
      setShowNotReady(false)
      return
    }
    setNotReadyMsg(outcome.message)
    // Already as small as it gets: leave just the breath. After an error the
    // button stays so it can be tried again.
    if (outcome.status === 'small') setCanBreakDown(false)
  }

  if (!task || !step) {
    return (
      <div className="next-step-card next-step-empty" data-tour="next-step">
        <SageMark size="sm" />
        <div className="empty-step-msg">
          <div className="empty-step-title">No active task yet</div>
          <div className="empty-step-desc">Add a task to get started, and I’ll help you break it down.</div>
        </div>
        {/* The breathing needs no task, so it's here from the start, as quiet
            as "Not ready?" so "Add a task" still leads. */}
        <button className="not-ready-link" onClick={() => setShowBreath(true)}>
          Take a breath first
        </button>
        <BreathModal isOpen={showBreath} onClose={() => setShowBreath(false)} />
      </div>
    )
  }

  const stepIndex = task.steps.findIndex(s => s.id === step.id)

  return (
    <div className="next-step-card" data-tour="next-step">
      <div className="step-header">
        <div className="step-badge">{stepIndex + 1}</div>
        <span className="step-label">Next Step</span>
        <div className="step-time-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
          </svg>
          {step.time}
        </div>
      </div>

      <div className="step-task-ctx">{task.name}</div>
      <div className="step-title">{step.title}</div>
      <div className="step-desc">{step.desc}</div>

      <div className="step-actions">
        <Button variant="primary" onClick={() => navigate('/focus')}>Start Now →</Button>
        <button className="not-ready-link" onClick={() => setShowNotReady(s => !s)}>
          Not ready? Let Sage help
        </button>
      </div>

      <BreathModal isOpen={showBreath} onClose={() => setShowBreath(false)} />

      {showNotReady && (
        <div className="sage-not-ready">
          <SageMark size="sm" />
          <div>
            <div className="snr-msg" aria-live="polite">{notReadyMsg}</div>
            {/* The gentlest option first, as Start Now leads its row. */}
            <div className="snr-actions">
              <button className="snr-btn snr-primary" onClick={() => setShowBreath(true)}>Take a breath first</button>
              {canBreakDown && (
                <button className="snr-btn" onClick={breakDown} disabled={breaking}>
                  {breaking ? 'Breaking it down…' : 'Break it down smaller'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
