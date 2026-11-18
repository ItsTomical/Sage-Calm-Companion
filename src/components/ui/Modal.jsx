import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

const FOCUSABLE = 'button:not(:disabled), input, textarea, select, [tabindex="0"]'

// Esc closes it the same way the backdrop does. While it's open, focus starts
// inside (on the main action if one is marked data-autofocus, otherwise the
// first thing that takes focus) and Tab can't wander out behind it; when it
// closes, focus goes back to whatever opened it.
export default function Modal({ isOpen, onBackdrop, children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const opener = document.activeElement
    const start = ref.current?.querySelector('[data-autofocus]') ?? ref.current?.querySelector(FOCUSABLE)
    start?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        onBackdrop?.()
      } else if (e.key === 'Tab' && ref.current) {
        const items = ref.current.querySelectorAll(FOCUSABLE)
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [isOpen])

  if (!isOpen) return null
  return createPortal(
    <div ref={ref} className="overlay active" onClick={onBackdrop} role="dialog" aria-modal="true">
      {children}
    </div>,
    document.body
  )
}
