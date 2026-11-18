import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import ProfileModal from './ProfileModal.jsx'
import HelpPanel from '../guide/HelpPanel.jsx'
import leafIcon from '../../assets/icons/leaf.png'
import './Sidebar.css'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    to: '/focus',
    label: 'Focus',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    to: '/reflect',
    label: 'Reflect',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Help and Profile also live in the phone header (Topbar), and "Back to
  // Help" on a single explanation reopens the panel. All of them come here,
  // so there is one panel and one modal whichever button was pressed.
  useEffect(() => {
    const openHelp = () => setHelpOpen(true)
    const toggleHelp = () => setHelpOpen(o => !o)
    const openProfile = () => setProfileOpen(true)
    window.addEventListener('sage-help-open', openHelp)
    window.addEventListener('sage-help-toggle', toggleHelp)
    window.addEventListener('sage-profile-open', openProfile)
    return () => {
      window.removeEventListener('sage-help-open', openHelp)
      window.removeEventListener('sage-help-toggle', toggleHelp)
      window.removeEventListener('sage-profile-open', openProfile)
    }
  }, [])

  // The floating companion keeps clear of the panel, so tell her it moved.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sage-help', { detail: helpOpen }))
  }, [helpOpen])


  return (
    <nav className="sidebar">
      <div className="sb-logo"><img src={leafIcon} alt="Sage" /></div>

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nb${isActive ? ' on' : ''}`}
          data-tour={`nav-${item.label.toLowerCase()}`}
        >
          {item.icon}
          <span className="nb-tip">{item.label}</span>
        </NavLink>
      ))}

      <div className="sb-bot">
        <button
          className={`nb${helpOpen ? ' on' : ''}`}
          onClick={() => setHelpOpen(o => !o)}
          aria-label="Help"
          aria-expanded={helpOpen}
          aria-controls="help-panel"
          data-help-toggle
          data-tour="help"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-2.9 2.6-2.9 4" />
            <circle cx="12" cy="17.6" r="1.1" fill="currentColor" stroke="none" />
          </svg>
          <span className="nb-tip">Help</span>
        </button>
        <button className="nb" onClick={() => setProfileOpen(true)} data-tour="profile">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
          </svg>
          <span className="nb-tip">Profile &amp; Settings</span>
        </button>
      </div>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </nav>
  )
}
