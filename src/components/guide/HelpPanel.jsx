import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { startTour, showGuideStep } from './Guide.jsx'
import { GUIDE_PAGES, GUIDE_STEPS } from '../../data/guide.js'
import './HelpPanel.css'

// Slides out beside the sidebar. It never navigates by itself: picking an
// item closes the panel first, so it is never in the way of the spotlight.
export default function HelpPanel({ isOpen, onClose }) {
  const location = useLocation()
  const ref = useRef(null)
  const opener = useRef(null)

  // Closing hands focus back to whichever Help button opened it (the
  // sidebar's, or the header's on a phone).
  function close(restoreFocus) {
    onClose()
    if (restoreFocus) opener.current?.focus?.()
  }

  useEffect(() => {
    if (!isOpen) return
    opener.current = document.activeElement
    ref.current?.querySelector('button')?.focus({ preventScroll: true })

    function onKey(e) {
      if (e.key === 'Escape') close(true)
    }
    // Clicking back into the page closes it. The Help buttons handle their
    // own clicks.
    function onPointer(e) {
      if (ref.current?.contains(e.target) || e.target.closest?.('[data-help-toggle]')) return
      close(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [isOpen])

  // The page you're on leads, then things that are everywhere, then the rest.
  const here = GUIDE_PAGES.find(p => p.path === location.pathname)
  const groups = [
    here,
    ...GUIDE_PAGES.filter(p => p !== here && p.path === null),
    ...GUIDE_PAGES.filter(p => p !== here && p.path !== null),
  ]
    .filter(Boolean)
    .map(page => ({
      ...page,
      current: page === here,
      items: GUIDE_STEPS.filter(s => s.help !== false && s.page === page.path),
    }))
    .filter(g => g.items.length)

  function pick(action) {
    // Focus goes back to the Help button first, so it is where the guide
    // returns it when the explanation closes.
    close(true)
    action()
  }

  return createPortal(
    <aside
      id="help-panel"
      ref={ref}
      className={`help-panel${isOpen ? ' open' : ''}`}
      role="dialog"
      aria-label="Help"
      aria-hidden={!isOpen}
    >
      <div className="hp-head">
        <div>
          <div className="hp-title">Help</div>
          <div className="hp-sub">Pick anything and I’ll show you</div>
        </div>
        <button className="hp-close" onClick={() => close(true)} title="Close">×</button>
      </div>

      <button className="hp-replay" onClick={() => pick(startTour)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        Replay tour
      </button>

      <div className="hp-scroll">
        {groups.map(group => (
          <div key={group.label} className="hp-group">
            <div className="section-label hp-group-label">
              {group.current ? `On this page · ${group.label}` : group.label}
            </div>
            {group.items.map(step => (
              <button key={step.id} className="hp-item" onClick={() => pick(() => showGuideStep(step.id))}>
                <span className="hp-item-title">{step.title}</span>
                <span className="hp-item-chev">›</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>,
    document.body
  )
}
