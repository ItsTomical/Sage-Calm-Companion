import { useEffect, useState } from 'react'
import { CHAINS } from '../../data/sageClips.js'
import { sageAnimation, useSageAnimationState } from '../../hooks/useSageAnimation.js'
import './SageClipTester.css'

// Development only: a small panel for trying every clip in sage.glb and
// watching the app's animation rules at work. AppLayout only loads it when
// import.meta.env.DEV is true, so it isn't in production builds at all.
// Hidden until Ctrl+Shift+S; open or closed is remembered.

const OPEN_KEY = 'sage-clip-tester-open'

const GROUPS = [
  { title: 'Loops', clips: ['sage_idle', 'sage_breathe_loop', 'sage_tour_talk_loop'] },
  { title: 'Mood reactions', clips: ['sage_react_low', 'sage_react_meh', 'sage_react_ok', 'sage_react_good', 'sage_react_great'] },
  { title: 'Check-ins', clips: ['sage_checkin_low', 'sage_checkin_meh', 'sage_checkin_ok', 'sage_checkin_good', 'sage_checkin_great'] },
  { title: 'Completing', clips: ['sage_step_complete', 'sage_task_complete'] },
  { title: 'Tour', clips: ['sage_tour_wave', 'sage_tour_finish'] },
]

const short = (clip) => clip?.replace(/^sage_/, '') ?? '—'

function readOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === 'true'
  } catch {
    return false
  }
}

function countdown(ms) {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function SageClipTester() {
  const [open, setOpen] = useState(readOpen)
  const state = useSageAnimationState()

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, String(open))
    } catch {
      // Not remembered; it still works for this visit.
    }
  }, [open])

  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  const { wanted, checkin } = state
  const going = [
    wanted.tour && `tour (${wanted.tour})`,
    wanted.breathing && 'breathing',
    wanted.chain && `chain ${wanted.chain}`,
  ].filter(Boolean).join(', ') || 'nothing'

  return (
    <div className="sct" role="region" aria-label="Sage clip tester (development only)">
      <div className="sct-head">
        <strong>Sage clips</strong>
        <span className="sct-dev">dev only · Ctrl+Shift+S</span>
        <button className="sct-close" onClick={() => setOpen(false)} aria-label="Hide clip tester">×</button>
      </div>

      <div className="sct-now">
        <div>
          Playing: <code>{short(state.clip)}</code>
          {state.chain && <> · chain <code>{state.chain}</code> ({state.phase})</>}
        </div>
        <div>Going on: {going}{state.pending && <> · next <code>{short(state.pending)}</code></>}</div>
        <div>
          Check-in: {checkin.status === 'counting' ? `in ${countdown(checkin.leftMs)}` : `paused (${checkin.status}), ${countdown(checkin.leftMs)} left`}
        </div>
      </div>

      <div className="sct-body">
        <div className="sct-group">
          <div className="sct-title">Chains (in → loop → out)</div>
          {Object.entries(CHAINS).map(([name, c]) => (
            <div className="sct-chain" key={name}>
              <span className="sct-chain-name">{name}</span>
              <button onClick={() => sageAnimation.startChain(name)}>Start</button>
              <button onClick={() => sageAnimation.stopChain(name)}>Stop</button>
              <span className="sct-chain-clips">
                {[c.in, c.loop, c.out].map(clip => (
                  <button
                    key={clip}
                    className={`sct-mini${state.clip === clip ? ' on' : ''}`}
                    title={`Play ${clip} on its own (testing only; the app always goes through the chain)`}
                    onClick={() => sageAnimation.debugPlay(clip)}
                  >
                    {clip.split('_').pop()}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>

        {GROUPS.map(g => (
          <div className="sct-group" key={g.title}>
            <div className="sct-title">{g.title}</div>
            <div className="sct-clips">
              {g.clips.map(clip => (
                <button
                  key={clip}
                  className={state.clip === clip ? 'on' : ''}
                  onClick={() => sageAnimation.debugPlay(clip)}
                >
                  {short(clip)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="sct-note">
        Clip buttons play straight away, outside the app's rules; whatever is
        going on takes over when they end. Chain Start/Stop use the real rules.
      </p>
    </div>
  )
}
