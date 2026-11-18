import { useState, useEffect } from 'react'

// True while the screen matches a query from utils/breakpoints.js, and
// re-renders when that changes (rotating a phone, resizing a window).
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
