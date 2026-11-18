/**
 * Formats seconds into MM:SS string.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Returns a human-friendly date string.
 * @returns {string}
 */
export function getTodayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Formats a saved ISO timestamp as a time of day, e.g. "3:42 pm".
 * @param {string} iso
 * @returns {string}
 */
export function formatClock(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
}
