// Everything Sage saves is namespaced with this prefix.
export const STORAGE_PREFIX = 'sage-'

// Cleared by prefix rather than by a hand-written list of keys, because a
// list falls behind as keys are added, and anything it misses (reflections,
// streaks, focus time) would quietly survive a "Clear all data". Any key added
// later is cleared without anyone having to come back here — as long as it
// keeps the prefix.
//
// Only localStorage is touched. Event names like 'sage-celebrate' and CSS
// classes like 'sage-float' share the prefix but live elsewhere, so they are
// never seen by this.
export function clearAllData() {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key))
    return true
  } catch {
    // Storage can be unavailable or full in private browsing. Report the
    // failure rather than reloading into the data the user asked to be rid of.
    return false
  }
}
