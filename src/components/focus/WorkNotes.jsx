import { useState, useEffect, useRef } from 'react'
import './WorkNotes.css'

const SAVE_AFTER_MS = 600

// Where the work for a step gets done. Saved onto the step as you go: shortly
// after typing stops, when you leave the box, and before switching to another
// step or leaving the page, so nothing written is ever lost. Used on the
// Focus page and, compact (no heading or step title of its own), in a step's
// pop-up on the Tasks page.
export default function WorkNotes({ step, onSave, compact = false }) {
  const [text, setText] = useState(step.notes || '')
  const [saved, setSaved] = useState(true)
  const [copied, setCopied] = useState(false)
  // The unsaved text and the save that belongs to its step. Kept together so
  // that text written for one step can never be saved onto the next.
  const pending = useRef(null)
  const timer = useRef(null)
  const copiedTimer = useRef(null)
  const box = useRef(null)

  function flush() {
    clearTimeout(timer.current)
    if (!pending.current) return
    pending.current.save(pending.current.text)
    pending.current = null
    setSaved(true)
  }

  // A different step: save anything outstanding for the old one, then load
  // the new one's notes.
  useEffect(() => {
    setText(step.notes || '')
    setSaved(true)
    return flush
  }, [step.id])

  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  function onChange(e) {
    setText(e.target.value)
    setSaved(false)
    pending.current = { text: e.target.value, save: onSave }
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, SAVE_AFTER_MS)
  }

  // Plain text, so it pastes cleanly into Word, Notion, Docs or a notes app.
  // Some browsers (or the app opened over plain http on a phone) don't allow
  // the clipboard API, so fall back to copying the selected text.
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      box.current?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  const tools = (
    <div className="wn-tools">
      <span className="wn-status" aria-live="polite">{saved ? 'Saved' : 'Saving…'}</span>
      <button className="wn-copy" onClick={copy} disabled={!text.trim()}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )

  return (
    <div className={`work-notes${compact ? ' compact' : ''}`} data-tour={compact ? undefined : 'work-notes'}>
      {compact ? tools : (
        <>
          <div className="wn-head">
            <div className="section-label wn-label">Your work</div>
            {tools}
          </div>
          <div className="wn-step">{step.title}</div>
        </>
      )}
      <textarea
        ref={box}
        className="wn-ta"
        value={text}
        onChange={onChange}
        onBlur={flush}
        placeholder="Work on your step here. It saves as you go."
        aria-label={`Your work for: ${step.title}`}
      />
    </div>
  )
}
