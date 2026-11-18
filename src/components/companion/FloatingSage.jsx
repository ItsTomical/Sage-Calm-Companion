import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import SageFigure from './SageFigure.jsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { PHONE, COMPACT } from '../../utils/breakpoints.js'
import './FloatingSage.css'

// Any component can make the floating Sage speak: saySage("Well done.")
export function saySage(message) {
  window.dispatchEvent(new CustomEvent('sage-say', { detail: message }))
}

const STORAGE_KEY = 'sage-corner'
// Phones and tablets have their own spot, so moving her there never
// changes where she sits on the desktop, and the other way round.
const BAND_KEY = 'sage-band-spot'
const MARGIN = 24
const BAND_MARGIN = 16

// Sage lives inside the page content area, not over the sidebar/topbar.
// On desktop the page leaves a rail (--sage-rail) down whichever side she's
// on; on smaller screens a band (--sage-band) along the bottom. Both are
// read from CSS so that stays the one place they're set.
function getBounds() {
  const el = document.querySelector('.pages')
  if (el) {
    const r = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    const rail = parseFloat(style.getPropertyValue('--sage-rail')) || 0
    const band = parseFloat(style.getPropertyValue('--sage-band')) || 0
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, rail, band }
  }
  return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, rail: 0, band: 0 }
}

// Centred in the side rail, so whichever corner she's in she never sits on
// top of the page. Without a rail (Sage hidden, or no room) she falls back
// to a plain margin from the edge.
function cornerCoords(corner, w, h, b) {
  const inset = b.rail >= w ? (b.rail - w) / 2 : MARGIN
  return {
    x: corner.includes('l') ? b.left + inset : b.right - w - inset,
    y: corner.includes('t') ? b.top + MARGIN : b.bottom - h - MARGIN,
  }
}

// Phones and tablets: left, centre or right of the bottom band, vertically
// centred in it. Centre lines up with the middle of the tab bar.
function bandCoords(spot, w, h, b) {
  const x =
    spot === 'left' ? b.left + BAND_MARGIN
    : spot === 'right' ? b.right - w - BAND_MARGIN
    : (b.left + b.right - w) / 2
  return { x, y: b.bottom - b.band / 2 - h / 2 }
}

const BAND_ORDER = ['left', 'centre', 'right']

export default function FloatingSage() {
  const [corner, setCorner] = useState(() => localStorage.getItem(STORAGE_KEY) || 'br')
  const [spot, setSpot] = useState(() => localStorage.getItem(BAND_KEY) || 'centre')
  const [dragPos, setDragPos] = useState(null)
  const [message, setMessage] = useState(null)
  const [visible, setVisible] = useState(() => localStorage.getItem('sage-visible') !== 'false')
  // While the guide is talking she is in its card instead, unless she's the
  // thing being pointed at. Never saved; the user's own setting is above.
  const [inGuide, setInGuide] = useState(false)
  // Same idea for anywhere else that shows her, like the breathing exercise:
  // announced with the 'sage-elsewhere' event, so there's only ever one Sage.
  const [elsewhere, setElsewhere] = useState(false)
  // The Help panel covers the left rail, so while it's open she uses the
  // right one. Her chosen corner is left alone and she returns to it.
  const [helpOpen, setHelpOpen] = useState(false)
  // A phone keyboard pushes the band right up against the field being typed
  // in, so she steps out of the way until it closes.
  const [typing, setTyping] = useState(false)
  const [, bumpResize] = useState(0)
  const ref = useRef(null)
  const grip = useRef(null)
  const lastPos = useRef(null)
  const hideTimer = useRef(null)

  const isPhone = useMediaQuery(PHONE)
  const isCompact = useMediaQuery(COMPACT)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const size = isPhone ? 64 : isCompact ? 80 : 104

  useEffect(() => {
    function onSay(e) {
      setMessage(e.detail)
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setMessage(null), 6000)
    }
    function onResize() {
      bumpResize(n => n + 1)
    }
    function onVisibility(e) {
      setVisible(e.detail)
    }
    function onHelp(e) {
      setHelpOpen(e.detail)
    }
    function onGuide(e) {
      setInGuide(e.detail.active && e.detail.target !== 'sage')
    }
    function onElsewhere(e) {
      setElsewhere(e.detail)
    }
    const isField = (el) => el?.matches?.('input:not([type="range"]), textarea, select, [contenteditable="true"]')
    function onFocusIn(e) {
      if (isField(e.target)) setTyping(true)
    }
    function onFocusOut(e) {
      if (isField(e.target)) setTyping(false)
    }
    window.addEventListener('sage-say', onSay)
    window.addEventListener('resize', onResize)
    window.addEventListener('sage-visibility', onVisibility)
    window.addEventListener('sage-guide-active', onGuide)
    window.addEventListener('sage-elsewhere', onElsewhere)
    window.addEventListener('sage-help', onHelp)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)
    bumpResize(n => n + 1) // re-measure once the page layout has mounted
    return () => {
      window.removeEventListener('sage-say', onSay)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('sage-visibility', onVisibility)
      window.removeEventListener('sage-guide-active', onGuide)
      window.removeEventListener('sage-elsewhere', onElsewhere)
      window.removeEventListener('sage-help', onHelp)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)
      clearTimeout(hideTimer.current)
    }
  }, [])

  // Saved, and announced so the page can move its rail to her side.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, corner)
    window.dispatchEvent(new CustomEvent('sage-corner', { detail: corner }))
  }, [corner])

  useEffect(() => {
    localStorage.setItem(BAND_KEY, spot)
  }, [spot])

  // Coming back (from the guide, or switched on in Settings), or changing
  // size with the screen, her size and the rails aren't known until the
  // layout has updated, so measure once more and settle in properly.
  // Her box can also change on its own, e.g. when the 3D figure replaces the
  // leaf that stands in while she downloads. Watching it re-places her
  // whenever it changes, so she never hangs past the corner.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const watch = new ResizeObserver(() => bumpResize(n => n + 1))
    watch.observe(el)
    return () => watch.disconnect()
  }, [visible, inGuide, elsewhere, isPhone, helpOpen])

  useLayoutEffect(() => {
    if (visible && !inGuide && !elsewhere) bumpResize(n => n + 1)
  }, [visible, inGuide, elsewhere, size])

  function onPointerDown(e) {
    const rect = ref.current.getBoundingClientRect()
    grip.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    e.preventDefault()

    function onMove(ev) {
      const b = getBounds()
      const w = ref.current.offsetWidth
      const h = ref.current.offsetHeight
      const x = Math.min(Math.max(ev.clientX - grip.current.dx, b.left + 8), b.right - w - 8)
      const y = Math.min(Math.max(ev.clientY - grip.current.dy, b.top + 8), b.bottom - h - 8)
      lastPos.current = { x, y, w, h }
      setDragPos({ x, y })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const p = lastPos.current
      if (p) {
        const b = getBounds()
        const cx = p.x + p.w / 2
        const cy = p.y + p.h / 2
        if (window.matchMedia(COMPACT).matches) {
          // Whichever third of the width she was let go in.
          const third = (b.right - b.left) / 3
          setSpot(BAND_ORDER[Math.min(2, Math.max(0, Math.floor((cx - b.left) / third)))])
        } else {
          const snapped =
            (cy < (b.top + b.bottom) / 2 ? 't' : 'b') +
            (cx < (b.left + b.right) / 2 ? 'l' : 'r')
          setCorner(snapped)
        }
      }
      lastPos.current = null
      setDragPos(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // The keyboard way to do what dragging does. On desktop each arrow moves
  // her to the corner on that side; on smaller screens left and right step
  // her along the band.
  function onKeyDown(e) {
    if (isCompact) {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
      if (!step) return
      e.preventDefault()
      setSpot(s => BAND_ORDER[Math.min(2, Math.max(0, BAND_ORDER.indexOf(s) + step))])
      return
    }
    const flip = { ArrowLeft: ['r', 'l'], ArrowRight: ['l', 'r'], ArrowUp: ['b', 't'], ArrowDown: ['t', 'b'] }[e.key]
    if (!flip) return
    e.preventDefault()
    setCorner(c => c.replace(flip[0], flip[1]))
  }

  // On a phone the Help panel is a sheet over the band, so she steps out.
  if (!visible || inGuide || elsewhere || (isPhone && helpOpen)) return null

  const bounds = getBounds()
  const w = ref.current?.offsetWidth ?? size
  const h = ref.current?.offsetHeight ?? size
  const dragging = dragPos !== null

  let p
  let bubbleClasses
  if (isCompact) {
    // Centred, she slides right to speak so her words can sit in the band
    // beside her instead of over the page. Parked at either end, she stays
    // and talks towards the open side. A tablet's Help panel covers the
    // left of the band, so she uses the right while it's open.
    let shownSpot = spot
    if (helpOpen) shownSpot = 'right'
    else if (message && spot === 'centre' && !reducedMotion) shownSpot = 'right'
    p = dragPos || bandCoords(shownSpot, w, h, bounds)

    bubbleClasses = [
      'fs-bubble',
      'band',
      shownSpot === 'right' ? 'to-left' : shownSpot === 'left' ? 'to-right' : 'centred',
    ].join(' ')
  } else {
    const shownCorner = helpOpen ? corner.replace('l', 'r') : corner
    p = dragPos || cornerCoords(shownCorner, w, h, bounds)

    const midX = (bounds.left + bounds.right) / 2
    const bubbleBelow = dragging ? p.y < bounds.top + 120 : shownCorner.includes('t')
    const bubbleLeftAlign = dragging ? p.x < midX : shownCorner.includes('l')
    bubbleClasses = [
      'fs-bubble',
      bubbleBelow ? 'below' : '',
      bubbleLeftAlign ? 'left-align' : '',
    ].filter(Boolean).join(' ')
  }

  return (
    <div
      ref={ref}
      className={[
        'floating-sage',
        dragging ? 'dragging' : '',
        isCompact && typing ? 'typing' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: p.x, top: p.y, '--sage-size': `${size}px` }}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={
        isCompact
          ? 'Sage, your companion. Use the left and right arrow keys to move her along the bottom.'
          : 'Sage, your companion. Use the arrow keys to move her to another corner.'
      }
      title="Drag me anywhere"
      data-tour="sage"
    >
      {message && <div className={bubbleClasses}>{message}</div>}
      <SageFigure size={size} float={!dragging} />
    </div>
  )
}
