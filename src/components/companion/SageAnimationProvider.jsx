import { useEffect } from 'react'
import {
  SageAnimationContext,
  sageAnimation,
  startSageAnimationClock,
} from '../../hooks/useSageAnimation.js'

// Sage's animation state for the whole app, in the layout so it outlives
// page changes. The rules themselves are in useSageAnimation.js; this keeps
// their clock running (check-ins) for as long as the app is open, and hands
// the API down to every page.
export default function SageAnimationProvider({ children }) {
  useEffect(() => startSageAnimationClock(), [])

  return (
    <SageAnimationContext.Provider value={sageAnimation}>
      {children}
    </SageAnimationContext.Provider>
  )
}
