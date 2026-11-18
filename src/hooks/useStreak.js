import { useState, useEffect } from 'react'

const DAYS_KEY = 'sage-activity-days'
const BEST_KEY = 'sage-best-streak'
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Local date key (not UTC) so evening work counts for the right day.
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Days the user finished something, and how many things: { 'YYYY-MM-DD': 3 }.
// Earlier versions stored a plain list of dates with no counts, so days from
// then are read back as one apiece — that is all the detail they ever held.
export function loadActivity() {
  try {
    const raw = JSON.parse(localStorage.getItem(DAYS_KEY) || '{}')
    if (Array.isArray(raw)) {
      return Object.fromEntries(raw.map(day => [day, 1]))
    }
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

// Call whenever the user completes steps or a task. `count` is how many
// steps it finished, so crossing off a seven-step task registers as seven
// rather than as one.
export function recordActivity(count = 1) {
  const days = loadActivity()
  const today = dateKey()
  days[today] = (days[today] || 0) + Math.max(1, count)
  localStorage.setItem(DAYS_KEY, JSON.stringify(days))
  window.dispatchEvent(new CustomEvent('sage-activity'))
}

// Unticking a step takes its credit back off the day it was actually done
// on, which the step itself remembers. Deleting a task never calls this: the
// work still happened, tidying the list away doesn't undo it.
//
// A day left with nothing is removed entirely, so undoing everything done on
// a day stops it counting as an active day.
export function removeActivity(dayKey, count = 1) {
  if (!dayKey) return
  const days = loadActivity()
  if (!days[dayKey]) return
  const remaining = days[dayKey] - Math.max(1, count)
  if (remaining > 0) days[dayKey] = remaining
  else delete days[dayKey]
  localStorage.setItem(DAYS_KEY, JSON.stringify(days))
  window.dispatchEvent(new CustomEvent('sage-activity'))
}

function compute() {
  const days = loadActivity()

  // Consecutive active days ending today, or ending yesterday if today
  // has no activity yet, so a streak isn't "broken" before the day is over.
  // Only whether a day is present matters here, never the count.
  let streak = 0
  const cursor = new Date()
  if (!days[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1)
  while (days[dateKey(cursor)]) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  const storedBest = parseInt(localStorage.getItem(BEST_KEY)) || 0
  const best = Math.max(storedBest, streak)
  if (best > storedBest) localStorage.setItem(BEST_KEY, String(best))

  const weekDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    weekDays.push({
      label: DAY_LETTERS[d.getDay()],
      done: Boolean(days[dateKey(d)]),
      today: i === 0,
    })
  }

  return { streak, best, weekDays }
}

export function useStreak() {
  const [data, setData] = useState(compute)

  useEffect(() => {
    const onActivity = () => setData(compute())
    window.addEventListener('sage-activity', onActivity)
    return () => window.removeEventListener('sage-activity', onActivity)
  }, [])

  return data
}
