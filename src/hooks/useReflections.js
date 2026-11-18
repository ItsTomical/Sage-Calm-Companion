import { useState, useEffect, useMemo } from 'react'
import { dateKey } from './useStreak.js'

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// The reflection streak and the weekly mood row are derived from the entries
// themselves rather than stored separately, so they stay correct when an entry
// is edited or deleted. A day counts once, represented by its latest entry.
function computeHistory(reflections) {
  const byDay = new Map()
  for (const r of reflections) {
    if (!r.createdAt) continue
    const at = new Date(r.createdAt)
    if (Number.isNaN(at.getTime())) continue
    const key = dateKey(at)
    const prev = byDay.get(key)
    if (!prev || at > new Date(prev.createdAt)) byDay.set(key, r)
  }

  // Consecutive days ending today, or ending yesterday when nothing has been
  // written yet today, so a streak isn't broken before the day is over.
  let streak = 0
  const cursor = new Date()
  if (!byDay.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (byDay.has(dateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  // Longest run of consecutive days ever recorded. Midday avoids the hour
  // shift on daylight-saving boundaries.
  const sorted = [...byDay.keys()].sort()
  let best = 0
  let run = 0
  let prev = null
  for (const key of sorted) {
    const dayBefore = new Date(`${key}T12:00:00`)
    dayBefore.setDate(dayBefore.getDate() - 1)
    run = prev === dateKey(dayBefore) ? run + 1 : 1
    best = Math.max(best, run)
    prev = key
  }

  const weekDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const entry = byDay.get(dateKey(d))
    weekDays.push({
      label: DAY_LETTERS[d.getDay()],
      done: Boolean(entry),
      today: i === 0,
      mood: entry?.moodLabel || null,
    })
  }

  return { streak, best, weekDays }
}

export function useReflections() {
  const [reflections, setReflections] = useState(() => {
    try {
      const saved = localStorage.getItem('sage-reflections')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('sage-reflections', JSON.stringify(reflections))
  }, [reflections])

  // The prompt is kept apart from the note so the history can show it as the
  // question and the note as the answer. Entries written without one have no
  // prompt field at all.
  function addReflection({ mood, note, prompt }) {
    const now = new Date()
    const entry = {
      id: Date.now(),
      day: String(now.getDate()),
      month: now.toLocaleString('en', { month: 'short' }),
      moodLabel: mood,
      note: note.trim(),
      ...(prompt ? { prompt } : {}),
      createdAt: now.toISOString(),
    }
    setReflections(prev => [entry, ...prev])
    return entry
  }

  // Editing changes what was written, not when: day/month/createdAt are
  // left as they were so an entry keeps the date it was recorded on.
  function updateReflection(id, patch) {
    setReflections(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  function deleteReflection(id) {
    setReflections(prev => prev.filter(r => r.id !== id))
  }

  const { streak, best, weekDays } = useMemo(() => computeHistory(reflections), [reflections])

  return {
    reflections,
    addReflection,
    updateReflection,
    deleteReflection,
    streak,
    best,
    weekDays,
  }
}
