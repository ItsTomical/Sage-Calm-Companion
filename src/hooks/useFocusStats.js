import { useState } from 'react'
import { dateKey } from './useStreak.js'

const KEY = 'sage-focus-seconds' // { 'YYYY-MM-DD': seconds }

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

// Called by the timer once per ticking second during a focus phase.
export function addFocusSeconds(n = 1) {
  const data = load()
  const k = dateKey()
  data[k] = (data[k] || 0) + n
  localStorage.setItem(KEY, JSON.stringify(data))
}

function compute() {
  const data = load()
  const todaySeconds = data[dateKey()] || 0

  const days = []
  let max = 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const sec = data[dateKey(d)] || 0
    max = Math.max(max, sec)
    days.push({ sec, today: i === 0 })
  }

  const weekBars = days.map(d => ({
    height: max > 0 ? Math.max(8, Math.round((d.sec / max) * 100)) : 8,
    today: d.today,
  }))

  const focusNum = todaySeconds >= 3600
    ? (todaySeconds / 3600).toFixed(1)
    : String(Math.round(todaySeconds / 60))
  const focusLbl = todaySeconds >= 3600 ? 'hours focused' : 'min focused'

  return { todaySeconds, weekBars, focusNum, focusLbl }
}

export function useFocusStats() {
  const [stats] = useState(compute)
  return stats
}
