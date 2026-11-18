import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { clearAllData } from '../../utils/storage.js'
import './ProfileModal.css'

export default function ProfileModal({ isOpen, onClose }) {
  const [name, setName] = useState(() => localStorage.getItem('sage-username') || '')
  const [showSage, setShowSage] = useState(() => localStorage.getItem('sage-visible') !== 'false')

  function handleName(e) {
    setName(e.target.value)
    localStorage.setItem('sage-username', e.target.value)
  }

  function handleToggleSage() {
    const next = !showSage
    setShowSage(next)
    localStorage.setItem('sage-visible', String(next))
    window.dispatchEvent(new CustomEvent('sage-visibility', { detail: next }))
  }

  function handleClearData() {
    const warning =
      'This will permanently delete everything Sage has saved in this browser: ' +
      'your tasks, reflections, streaks, focus time and settings. ' +
      'It cannot be undone. Continue?'
    if (!window.confirm(warning)) return

    if (clearAllData()) {
      window.location.reload()
    } else {
      // Reloading here would look like it worked while the data was still
      // there, which is worse than saying nothing happened.
      window.alert(
        'Sage could not clear your data. Your browser may be blocking storage.',
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onBackdrop={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose} title="Close">×</button>

        <div className="pm-head">
          <div className="pm-avatar">
            {name.trim() ? name.trim()[0].toUpperCase() : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
              </svg>
            )}
          </div>
          <div>
            <div className="pm-title">Profile &amp; Settings</div>
            <div className="pm-sub">Make Sage yours</div>
          </div>
        </div>

        <div className="pm-section">
          <label className="pm-label" htmlFor="pm-name">Display name</label>
          <input
            id="pm-name"
            className="pm-input"
            type="text"
            placeholder="What should Sage call you?"
            value={name}
            onChange={handleName}
            aria-describedby="pm-name-hint"
          />
          <p className="pm-hint" id="pm-name-hint">
            Sage uses this when she talks to you. It stays on this device.
          </p>
        </div>

        <div className="pm-section">
          <div className="pm-label">Settings</div>
          <div className="pm-row">
            <span>Show floating Sage</span>
            <button
              className={`pm-switch${showSage ? ' on' : ''}`}
              onClick={handleToggleSage}
              role="switch"
              aria-checked={showSage}
            >
              <span className="pm-knob" />
            </button>
          </div>
        </div>

        <div className="pm-section pm-last">
          <button className="pm-danger" onClick={handleClearData}>Clear all data</button>
          <div className="pm-danger-note">Permanently removes your tasks, reflections, streaks and settings from this browser.</div>
        </div>
      </div>
    </Modal>
  )
}
