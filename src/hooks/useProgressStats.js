import { useState } from 'react'
import { dateKey, loadActivity } from './useStreak.js'
import firstStepIcon from '../assets/icons/first-step.png'
import flameIcon from '../assets/icons/flame.png'
import flowStateIcon from '../assets/icons/flow-state.png'
import calmMindIcon from '../assets/icons/calm-mind.png'
import milestoneIcon from '../assets/icons/milestone.png'
import consistentIcon from '../assets/icons/consistent.png'

// Everything the Progress page shows is worked out here from what the user
// has actually done. Nothing is stored separately, so the page cannot drift
// out of step with the tasks, reflections and focus time it describes.

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Points are awarded for finishing things, with time spent counting for less
// than work completed — an hour on the timer that finished nothing is not the
// same as an hour that cleared a task. A reflection is worth more than a
// single step because it is the thing people skip.
//
// A placeholder scheme, kept deliberately simple: it exists so the card shows
// something earned rather than something invented, and will be replaced when
// unlockable rewards for Sage arrive.
const XP_PER_STEP = 10
const XP_PER_TASK = 50
const XP_PER_FOCUS_MINUTE = 1
const XP_PER_REFLECTION = 15
const XP_PER_LEVEL = 500

// The "How XP works" list on the page is built from the same constants the
// total is, so the explanation can't drift from the numbers.
const XP_RULES = [
  { label: 'Finish a step', xp: XP_PER_STEP },
  { label: 'Finish a whole task', xp: XP_PER_TASK },
  { label: 'Each minute of focus', xp: XP_PER_FOCUS_MINUTE },
  { label: 'Save a reflection', xp: XP_PER_REFLECTION },
]

function read(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

// Steps finished decide how filled a day's square is. Focus time has its own
// two places on this page already, and getting things done is what the app is
// actually for — an afternoon on the timer that finished nothing is not the
// same as an afternoon that cleared a task.
//
// Focus time is still a floor: a day spent working without finishing anything
// shows the lightest shade rather than reading as a day off.
function levelFor(steps, minutes) {
  if (steps >= 8) return 'l4'
  if (steps >= 5) return 'l3'
  if (steps >= 3) return 'l2'
  if (steps >= 1) return 'l1'
  if (minutes >= 1) return 'l1'
  return 'l0'
}

function compute() {
  const tasks = read('sage-tasks', [])
  const reflections = read('sage-reflections', [])
  const focusByDay = read('sage-focus-seconds', {})
  // { 'YYYY-MM-DD': steps finished that day }
  const activity = loadActivity()

  const tasksCompleted = tasks.filter(t => t.done).length
  const stepsCompleted = tasks.reduce(
    (sum, t) => sum + (t.steps?.filter(s => s.done).length || 0),
    0,
  )

  const totalFocusSeconds = Object.values(focusByDay).reduce(
    (sum, s) => sum + (Number(s) || 0),
    0,
  )
  const totalFocusHours = totalFocusSeconds / 3600

  // This calendar week, Monday to Sunday, rather than a rolling seven days.
  // The chart then always reads M–S and lines up with the month calendars
  // below it; days later in the week simply have no time on them yet.
  const today = new Date()
  const todayKey = dateKey(today)
  const monday = new Date()
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  const week = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = dateKey(d)
    week.push({
      label: DAY_LABELS[i],
      seconds: Number(focusByDay[key]) || 0,
      today: key === todayKey,
      future: d > today,
    })
  }

  const weekPeak = Math.max(...week.map(d => d.seconds), 0)
  const weekBars = week.map(d => ({
    label: d.label,
    today: d.today,
    future: d.future,
    // A floor of 8 keeps an empty day visible as a baseline rather than
    // vanishing, which would read as a missing bar rather than a quiet day.
    height: weekPeak > 0 ? Math.max(8, Math.round((d.seconds / weekPeak) * 100)) : 8,
  }))

  // Summed over the same Monday-to-Sunday week the chart draws, so the
  // "This week" figure and the bars can't describe different periods.
  const weekFocusHours = week.reduce((sum, d) => sum + d.seconds, 0) / 3600

  // A level per day that has anything on it. Days with nothing are simply
  // absent, and the calendar treats a missing day as empty — so this only
  // ever holds as many entries as the user has days of history.
  const dayLevels = {}
  const seenDays = new Set([...Object.keys(focusByDay), ...Object.keys(activity)])
  seenDays.forEach(key => {
    const minutes = (Number(focusByDay[key]) || 0) / 60
    const level = levelFor(Number(activity[key]) || 0, minutes)
    if (level !== 'l0') dayLevels[key] = level
  })

  // How far back the calendar can go. Taken from the earliest day with
  // anything recorded, so the arrows stop rather than paging into years of
  // blank months.
  const allKeys = [...seenDays].sort()
  const earliestDay = allKeys.length ? allKeys[0] : null

  const bestStreak = parseInt(localStorage.getItem('sage-best-streak')) || 0

  const xp =
    stepsCompleted * XP_PER_STEP +
    tasksCompleted * XP_PER_TASK +
    Math.floor(totalFocusSeconds / 60) * XP_PER_FOCUS_MINUTE +
    reflections.length * XP_PER_REFLECTION

  // Levels are a fixed size rather than a widening curve. A curve would make
  // early levels arrive quickly and later ones stall, which is a pressure
  // this app has no reason to create.
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const xpIntoLevel = xp % XP_PER_LEVEL
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel
  const levelProgress = (xpIntoLevel / XP_PER_LEVEL) * 100

  // Each badge's `how` is the line shown under it, written from the rule
  // beside it and sharing its threshold, so the two are changed together.
  // A day in `activity` is one where a step was finished, either by ticking
  // it or by crossing off its task, which is what Consistent counts.
  const streakDays = 7
  const flowHours = 1
  const calmReflections = 10
  const milestoneTasks = 10
  const consistentDays = 15

  const badges = [
    {
      id: 1, icon: firstStepIcon, name: 'First Step',
      earned: stepsCompleted >= 1,
      how: 'Finish your first step',
    },
    {
      id: 2, icon: flameIcon, name: `${streakDays}-Day Streak`,
      earned: bestStreak >= streakDays,
      how: `Reach a ${streakDays}-day streak`,
    },
    {
      id: 3, icon: flowStateIcon, name: 'Flow State',
      earned: Object.values(focusByDay).some(s => Number(s) >= flowHours * 3600),
      how: `Focus for ${flowHours === 1 ? 'an hour' : `${flowHours} hours`} in one day`,
    },
    {
      id: 4, icon: calmMindIcon, name: 'Calm Mind',
      earned: reflections.length >= calmReflections,
      how: `Save ${calmReflections} reflections`,
    },
    {
      id: 5, icon: milestoneIcon, name: 'Milestone',
      earned: tasksCompleted >= milestoneTasks,
      how: `Finish ${milestoneTasks} tasks`,
    },
    {
      id: 6, icon: consistentIcon, name: 'Consistent',
      earned: Object.keys(activity).length >= consistentDays,
      how: `Finish a step on ${consistentDays} different days`,
    },
  ]

  const milestone = (label, value, target) => ({
    label,
    value: Math.min(100, Math.round((value / target) * 100)),
    done: value >= target,
  })

  const milestones = [
    milestone('10-day streak', bestStreak, 10),
    milestone('50 tasks done', tasksCompleted, 50),
    milestone('25h focused', totalFocusHours, 25),
  ]

  const hasAnyActivity =
    tasks.length > 0 || reflections.length > 0 || totalFocusSeconds > 0

  return {
    xp,
    level,
    xpToNextLevel,
    levelProgress,
    xpRules: XP_RULES,
    xpPerLevel: XP_PER_LEVEL,
    tasksCompleted,
    stepsCompleted,
    reflectionsCount: reflections.length,
    weekFocusHours,
    totalFocusHours,
    activeDayCount: Object.keys(activity).length,
    weekBars,
    dayLevels,
    earliestDay,
    badges,
    milestones,
    hasAnyActivity,
  }
}

export function useProgressStats() {
  // Computed once per mount. Every route change remounts the page, so the
  // figures are recalculated whenever it is opened.
  const [stats] = useState(compute)
  return stats
}
