import { useState } from 'react'
import Panel from '../ui/Panel.jsx'
import SageMark from '../companion/SageMark.jsx'
import { buildNudges } from '../../data/nudges.js'
import { getUserName } from '../../utils/userName.js'
import './NudgeCard.css'

// Sage's nudge: one card, mostly nudges that fit the moment, with a quote now
// and then (see data/nudges.js). It changes when something changes (mood,
// a step done) and when "Another" is pressed, never on a timer, so nothing
// moves while someone is trying to settle.
export default function NudgeCard(ctx) {
  const deck = buildNudges({ ...ctx, name: getUserName() })
  // Back to the most fitting one whenever what fits changes.
  const key = deck.map(n => n.id).join('|')
  const [pos, setPos] = useState({ key, i: 0 })
  const i = pos.key === key ? pos.i : 0
  const nudge = deck[i % deck.length]

  return (
    <Panel className="mp-nudge" data-tour="nudge">
      <div className="nudge-head">
        <SageMark size="xs" />
        <div className="section-label nudge-label">From Sage</div>
        <button
          className="nudge-next"
          onClick={() => setPos({ key, i: (i + 1) % deck.length })}
          aria-label="Show another nudge"
          title="Another"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>
      {/* The live region stays put so a change is announced (pressing
          "Another" is heard); only its contents are swapped, with a fade. */}
      <div className="nudge-body" aria-live="polite">
        <div className="nudge-content" key={nudge.id}>
          {nudge.quote ? (
            <div className="nudge-quote">“{nudge.quote}”</div>
          ) : (
            <>
              <div className="nudge-title">{nudge.title}</div>
              <div className="nudge-text">{nudge.text}</div>
            </>
          )}
        </div>
      </div>
    </Panel>
  )
}
