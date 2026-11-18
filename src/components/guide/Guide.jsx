import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import SageFigure from '../companion/SageFigure.jsx'
import { useSageAnimation } from '../../hooks/useSageAnimation.js'
import { GUIDE_STEPS, tourStepsFor } from '../../data/guide.js'
import { activeTaskOf } from '../../hooks/useTasks.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { COMPACT, PHONE } from '../../utils/breakpoints.js'
import { withName } from '../../utils/userName.js'
import { saySage } from '../companion/FloatingSage.jsx'
import './Guide.css'

// Any component can start these, the same way as saySage() and celebrate().
export function startTour() {
  window.dispatchEvent(new CustomEvent('sage-guide', { detail: { type: 'tour' } }))
}

export function showGuideStep(id) {
  window.dispatchEvent(new CustomEvent('sage-guide', { detail: { type: 'step', id } }))
}

// Prefixed so "Clear all data" resets it and a fresh start gets the tour again.
const DONE_KEY = 'sage-tour-done'
const WAIT_MS = 1500   // how long to wait for an element after navigating
const GAP = 14         // between the spotlight and the card
const EDGE = 16        // card never closer than this to the viewport edge
const PAD = 6          // spotlight breathing room around the element
const SHEET_BELOW = 640

function tourDone() {
  try {
    return localStorage.getItem(DONE_KEY) === 'true'
  } catch {
    return true // no storage, so no way to remember; don't force it every load
  }
}

function markTourDone() {
  try {
    localStorage.setItem(DONE_KEY, 'true')
  } catch {
    // Nothing to do; the tour will simply offer itself again next time.
  }
}

// What's saved, read once as the guide opens: which tour steps this person
// will actually see (so the counter only counts those), and whether the
// dashboard is still empty. "Break it down" only shows on Tasks while
// there's no task with steps to show instead.
function savedContext() {
  let tasks = []
  let activeId = null
  try {
    const saved = JSON.parse(localStorage.getItem('sage-tasks'))
    if (Array.isArray(saved)) tasks = saved
    activeId = Number(localStorage.getItem('sage-active-task')) || null
  } catch {
    // Unreadable: treated as no tasks yet.
  }
  const active = activeTaskOf(tasks, activeId)
  return { hasTasks: tasks.length > 0, hasPlan: Boolean(active?.steps?.length) }
}

// The spotlight around several elements at once (a step's target and its
// `also`), from each one's visible part.
function unionRect(rects) {
  const shown = rects.filter(Boolean)
  if (!shown.length) return null
  const top = Math.min(...shown.map(r => r.top))
  const left = Math.min(...shown.map(r => r.left))
  const bottom = Math.max(...shown.map(r => r.top + r.height))
  const right = Math.max(...shown.map(r => r.left + r.width))
  return { top, left, width: right - left, height: bottom - top }
}

// The first element on screen for a data-tour name. Some things exist twice,
// one per layout (Help is in the sidebar on desktop and the header on a
// phone), so take the one that's showing.
function findTarget(name) {
  return [...document.querySelectorAll(`[data-tour="${name}"]`)]
    .find(candidate => candidate.getClientRects().length)
}

// After the first-run tour, someone with nothing added yet goes straight to
// writing their first task. Once the box has rendered, Sage invites them in.
// On a desktop it takes focus; on phones and tablets it's left one tap away,
// as focusing it would raise the keyboard and she steps aside for that.
function startFirstTask() {
  const started = performance.now()
  function look() {
    const box = document.querySelector('.ai-input-ta')
    if (box) {
      if (!window.matchMedia(COMPACT).matches) box.focus()
      saySage(withName(
        n => `Let’s start with one thing you’ve been putting off, ${n}.`,
        'Let’s start with one thing you’ve been putting off.',
      ))
    } else if (performance.now() - started < WAIT_MS) {
      requestAnimationFrame(look)
    }
  }
  requestAnimationFrame(look)
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Pages are overflow:hidden with their own scrolling columns. scrollIntoView
// would also scroll the hidden containers, leaving the page stuck offset with
// no scrollbar to undo it, so only containers the user can scroll are moved.
//
// On a phone the card is a sheet along the bottom of the screen, so the
// target goes to the top of its column, where the sheet can't cover it.
// There it jumps straight there rather than gliding, so the card and its
// spotlight are in place the moment the step changes.
function scrollIntoReach(el) {
  const toTop = window.matchMedia(PHONE).matches
  const behavior = reducedMotion() || toTop ? 'auto' : 'smooth'
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p)
    if (!/(auto|scroll)/.test(overflowY) || p.scrollHeight <= p.clientHeight) continue
    const pr = p.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (toTop) {
      p.scrollBy({ top: r.top - pr.top - 12, behavior })
    } else if (r.top < pr.top) {
      p.scrollBy({ top: r.top - pr.top - 12, behavior })
    } else if (r.bottom > pr.bottom) {
      // Bring the bottom into view, but never push the top out of it.
      p.scrollBy({ top: Math.min(r.bottom - pr.bottom + 12, r.top - pr.top - 12), behavior })
    }
  }
}

// The part of the element actually on screen: clipped by the viewport and by
// every ancestor that hides its overflow. Null when none of it shows.
// A column dissolved with display: contents (on phones and tablets) has no
// box of its own and clips nothing, so it's passed over; measuring it would
// give an empty rect and hide the spotlight.
function visibleRect(el) {
  const r = el.getBoundingClientRect()
  let top = Math.max(r.top, 0)
  let left = Math.max(r.left, 0)
  let bottom = Math.min(r.bottom, window.innerHeight)
  let right = Math.min(r.right, window.innerWidth)
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const s = getComputedStyle(p)
    if (s.display === 'contents') continue
    if (s.overflowX === 'visible' && s.overflowY === 'visible') continue
    const pr = p.getBoundingClientRect()
    top = Math.max(top, pr.top)
    left = Math.max(left, pr.left)
    bottom = Math.min(bottom, pr.bottom)
    right = Math.min(right, pr.right)
  }
  if (bottom - top < 1 || right - left < 1) return null
  return { top, left, width: right - left, height: bottom - top }
}

// Where the card goes. Tries the step's preferred side first, then whichever
// side has room; on narrow screens it becomes a sheet away from the target.
function placeCard(rect, card, preferred) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (vw < SHEET_BELOW) {
    const targetLow = rect && rect.top + rect.height / 2 > vh / 2
    // Top or bottom edge is set in Guide.css, which can allow for the notch
    // and gesture bar.
    return { sheet: targetLow ? 'top' : 'bottom', style: {} }
  }
  if (!rect) {
    return { style: { left: (vw - card.w) / 2, top: (vh - card.h) / 2 } }
  }

  const r = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    right: rect.left + rect.width + PAD,
    bottom: rect.top + rect.height + PAD,
  }
  const clampX = (x) => Math.min(Math.max(x, EDGE), vw - card.w - EDGE)
  const clampY = (y) => Math.min(Math.max(y, EDGE), vh - card.h - EDGE)
  const midX = r.left + (r.right - r.left) / 2
  const midY = r.top + (r.bottom - r.top) / 2

  const sides = {
    right:  () => r.right + GAP + card.w <= vw - EDGE && { left: r.right + GAP, top: clampY(midY - card.h / 2) },
    left:   () => r.left - GAP - card.w >= EDGE && { left: r.left - GAP - card.w, top: clampY(midY - card.h / 2) },
    bottom: () => r.bottom + GAP + card.h <= vh - EDGE && { left: clampX(midX - card.w / 2), top: r.bottom + GAP },
    top:    () => r.top - GAP - card.h >= EDGE && { left: clampX(midX - card.w / 2), top: r.top - GAP - card.h },
  }
  const order = [preferred, 'right', 'left', 'bottom', 'top'].filter(s => sides[s])

  for (const side of order) {
    const pos = sides[side]()
    if (!pos) continue
    // The tail points at the middle of the target, wherever the card was
    // clamped to.
    const tail = side === 'left' || side === 'right'
      ? Math.min(Math.max(midY - pos.top, 20), card.h - 20)
      : Math.min(Math.max(midX - pos.left, 20), card.w - 20)
    return { side, tail, style: pos }
  }

  // A target too big for any side (a whole column): sit inside it, low down.
  return { style: { left: clampX(midX - card.w / 2), top: clampY(r.bottom - card.h - EDGE) } }
}

export default function Guide() {
  const navigate = useNavigate()
  const location = useLocation()

  const [run, setRun] = useState(null)   // { mode: 'tour' | 'single', steps, index, ctx }
  const [view, setView] = useState({ id: null, status: 'seeking', el: null, extra: [] })
  const [rect, setRect] = useState(null)
  const [place, setPlace] = useState(null)

  const cardRef = useRef(null)
  const direction = useRef(1)       // so skipping a missing step keeps going in the same direction
  const expectedPath = useRef(null) // the route the guide navigated to
  const lastMode = useRef(null)
  const returnFocus = useRef(null)

  const step = run ? run.steps[run.index] : null
  const isPhone = useMediaQuery(PHONE)

  // Sage's tour animations: a wave as the tour starts and again on the step
  // that introduces her, the talking loop on every step, and her "here you
  // go" when it's finished or skipped. A single step shown from Help just
  // talks. Nothing lower (check-ins, reactions) can interrupt the tour.
  const sage = useSageAnimation()
  const runMode = run?.mode ?? null
  useEffect(() => {
    if (!runMode) return
    sage.tourStart(runMode)
    return () => sage.tourEnd()
  }, [runMode, sage])


  function begin(mode, steps, ctx) {
    if (!returnFocus.current) returnFocus.current = document.activeElement
    expectedPath.current = location.pathname
    direction.current = 1
    setView({ id: null, status: 'seeking', el: null, extra: [] })
    setRect(null)
    setRun({ mode, steps, index: 0, ctx })
  }

  function beginTour() {
    const ctx = savedContext()
    begin('tour', tourStepsFor(ctx), ctx)
  }

  function exit() {
    setRun(null)
  }

  // Finishing the tour (not skipping it). With nothing added yet, the next
  // thing to do is add a task, so they're taken to it; otherwise they stay
  // where they are.
  function finish() {
    if (run?.mode === 'tour' && !savedContext().hasTasks) {
      returnFocus.current = null
      navigate('/tasks', { state: { compose: true } })
      startFirstTask()
    }
    exit()
  }

  function go(delta) {
    direction.current = delta
    if (run && delta > 0 && run.index + delta >= run.steps.length) {
      finish()
      return
    }
    setRun(r => {
      if (!r) return r
      const i = r.index + delta
      if (i < 0) return r
      if (i >= r.steps.length) return null
      return { ...r, index: i }
    })
  }

  // First visit. Waits until "/" has redirected to /dashboard (App.jsx), so
  // the redirect isn't mistaken for the user leaving the tour's page.
  const autoStarted = useRef(false)
  useEffect(() => {
    if (autoStarted.current || location.pathname === '/') return
    autoStarted.current = true
    if (!tourDone()) beginTour()
  }, [location.pathname])

  useEffect(() => {
    function onGuide(e) {
      if (e.detail.type === 'tour') {
        beginTour()
      } else {
        const found = GUIDE_STEPS.find(s => s.id === e.detail.id)
        if (found) begin('single', [found], savedContext())
      }
    }
    window.addEventListener('sage-guide', onGuide)
    return () => window.removeEventListener('sage-guide', onGuide)
  })

  // Remember the tour however it ended, hand focus back, and let the floating
  // Sage know whether to step aside (she is in the card instead).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sage-guide-active', {
      detail: { active: Boolean(run), target: step?.target ?? null },
    }))
    if (!run) {
      if (lastMode.current === 'tour') markTourDone()
      if (lastMode.current) {
        returnFocus.current?.focus?.()
        returnFocus.current = null
      }
    }
    lastMode.current = run?.mode ?? null
  }, [run, step?.target])

  // The user went somewhere else (the browser's back button; the page itself
  // is blocked). Follow them rather than drag them back.
  useEffect(() => {
    if (run && location.pathname !== expectedPath.current) exit()
  }, [location.pathname])

  // Get to the step's page, then wait for its element to render.
  useEffect(() => {
    if (!step) return
    if (step.page && location.pathname !== step.page) {
      expectedPath.current = step.page
      navigate(step.page)
    }
    if (!step.target) {
      setView({ id: step.id, status: 'ready', el: null, extra: [] })
      return
    }

    const started = performance.now()
    let frame
    function look() {
      const el = findTarget(step.target)
      if (el) {
        scrollIntoReach(el)
        const extra = (step.also ?? []).map(findTarget).filter(Boolean)
        setView({ id: step.id, status: 'ready', el, extra })
      } else if (performance.now() - started > WAIT_MS) {
        if (run.mode === 'tour' && step.optional) go(direction.current)
        else setView({ id: step.id, status: 'missing', el: null, extra: [] })
      } else {
        frame = requestAnimationFrame(look)
      }
    }
    frame = requestAnimationFrame(look)
    return () => cancelAnimationFrame(frame)
  }, [run])

  // Keep the spotlight on the element as columns scroll or the window resizes.
  useEffect(() => {
    const el = view.el
    if (!el) {
      if (view.status !== 'seeking') setRect(null)
      return
    }
    const all = [el, ...view.extra]
    const update = () => setRect(unionRect(all.map(visibleRect)))
    update()
    const resize = new ResizeObserver(update)
    all.forEach(e => resize.observe(e))
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      resize.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [view])

  // Ready once the current step's element has been found (or given up on).
  // Until then the card stays mounted but hidden, so Sage's canvas isn't torn
  // down and rebuilt between every step.
  const ready = Boolean(step) && view.id === step.id && view.status !== 'seeking'

  // Her second wave, once the step introducing her is actually on screen.
  // With the floating Sage switched off that step is skipped, and so is the
  // wave.
  const sageStepShown = ready && step.target === 'sage' && view.status !== 'missing'
  useEffect(() => {
    if (sageStepShown) sage.tourStep(true)
  }, [sageStepShown, step?.id, sage])

  // Measured before paint, so the card never flashes in the wrong place.
  useLayoutEffect(() => {
    if (!ready || !cardRef.current) return
    const onResize = () => {
      const card = { w: cardRef.current.offsetWidth, h: cardRef.current.offsetHeight }
      setPlace(placeCard(rect, card, step.placement))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [ready, rect, step])

  useEffect(() => {
    if (ready) cardRef.current?.querySelector('[data-primary]')?.focus({ preventScroll: true })
  }, [ready, step])

  useEffect(() => {
    if (!run) return
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        exit()
      } else if (run.mode === 'tour' && e.key === 'ArrowRight') {
        go(1)
      } else if (run.mode === 'tour' && e.key === 'ArrowLeft') {
        go(-1)
      } else if (e.key === 'Tab' && cardRef.current) {
        // Keep focus inside the card while it's open.
        const items = cardRef.current.querySelectorAll('button:not(:disabled)')
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        } else if (!cardRef.current.contains(document.activeElement)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run])

  if (!run) return null

  const tour = run.mode === 'tour'
  const isLast = run.index === run.steps.length - 1
  const missing = ready && view.status === 'missing'
  // While the next element is being found the spotlight stays where it was,
  // so it glides to the new target instead of blinking off and on.
  const spot = Boolean(rect)
  const showSage = step.target !== 'sage' || missing
  // An empty dashboard gets the words written for it, where a step has them.
  const words = (!run.ctx?.hasTasks && step.empty) || step

  const cardClasses = [
    'guide-card',
    place?.sheet ? `sheet sheet-${place.sheet}` : '',
    place?.side && spot ? `tail-${place.side}` : '',
  ].filter(Boolean).join(' ')

  return createPortal(
    <div className="guide">
      <div
        className={`guide-catcher${spot ? '' : ' dim'}`}
        onClick={() => { if (!tour) exit() }}
      />
      {spot && (
        <div
          className="guide-spot"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      <div
        ref={cardRef}
        className={cardClasses}
        style={{ ...place?.style, '--tail': `${place?.tail ?? 0}px`, visibility: ready && place ? 'visible' : 'hidden' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        aria-describedby="guide-body"
      >
        {showSage && (
          <div className="guide-sage">
            <SageFigure size={isPhone ? 44 : 56} />
          </div>
        )}

        <div className="guide-content">
          <div className="guide-title" id="guide-title">
            {/* Her hello uses their name, if they've set one in Settings. */}
            {step.id === 'welcome' ? withName(n => `Hello ${n}, I’m Sage`, step.title) : step.title}
          </div>
          <div className="guide-body" id="guide-body" aria-live="polite">
            {(isPhone && words.mobileBody) || words.body}
            {missing && step.missing && <div className="guide-missing">{step.missing}</div>}
          </div>

          {tour ? (
            <div className="guide-actions">
              <button className="guide-link" onClick={exit}>Skip tour</button>
              <span className="guide-count">{run.index + 1} of {run.steps.length}</span>
              <button className="guide-btn" onClick={() => go(-1)} disabled={run.index === 0}>Back</button>
              <button className="guide-btn primary" data-primary onClick={() => go(1)}>
                {isLast ? 'Finish' : 'Next'}
              </button>
            </div>
          ) : (
            <div className="guide-actions">
              <button
                className="guide-link"
                onClick={() => {
                  // The panel takes focus as it reopens; don't pull it back.
                  returnFocus.current = null
                  exit()
                  window.dispatchEvent(new CustomEvent('sage-help-open'))
                }}
              >
                ‹ Back to Help
              </button>
              <button className="guide-btn primary" data-primary onClick={exit}>Got it</button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
