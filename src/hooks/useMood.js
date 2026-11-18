import { useState, useCallback } from 'react'
import { dateKey } from './useStreak.js'

// Today's mood: the last one picked today, on the Dashboard or on Reflect.
// Saved with its date, so tomorrow starts with none chosen. Sage's check-ins
// use it to match how the user has been feeling.
const TODAY_KEY = 'sage-mood-today'

export function getTodayMood() {
  try {
    const saved = JSON.parse(localStorage.getItem(TODAY_KEY))
    return saved?.date === dateKey() ? saved.mood : null
  } catch {
    return null
  }
}

export function saveTodayMood(mood) {
  try {
    localStorage.setItem(TODAY_KEY, JSON.stringify({ date: dateKey(), mood }))
  } catch {
    // Storage full or blocked: the picker still shows it for this visit.
  }
}

// The Dashboard's mood picker. Starts on today's mood if one was picked,
// otherwise on none.
export function useMood() {
  const [selectedMood, setSelectedMood] = useState(getTodayMood)

  const selectMood = useCallback((mood) => {
    setSelectedMood(mood)
    saveTodayMood(mood)
  }, [])

  return { selectedMood, selectMood }
}
