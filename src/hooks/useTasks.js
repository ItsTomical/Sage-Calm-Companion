import { useState, useRef } from 'react'
import { recordActivity, removeActivity, dateKey } from './useStreak.js'
import { celebrate } from '../components/companion/Celebration.jsx'
import { sageAnimation } from './useSageAnimation.js'
import { saySage } from '../components/companion/FloatingSage.jsx'
import { withName } from '../utils/userName.js'

// Said with the confetti, whenever a whole task is finished.
function sayTaskDone() {
  saySage(withName(
    n => `That's the whole task done, ${n}. Take a moment to enjoy it.`,
    "That's the whole task done. Take a moment to enjoy it.",
  ))
}

// The step the user is currently on: their explicit choice if it's still
// unfinished, otherwise the first unfinished step.
export function currentStepOf(task) {
  if (!task?.steps?.length) return null
  return (
    task.steps.find(s => s.id === task.activeStepId && !s.done) ||
    task.steps.find(s => !s.done) ||
    null
  )
}

// The task Sage works on with them: their chosen one while it's unfinished;
// otherwise the first unfinished task. Null when everything is done.
export function activeTaskOf(tasks, activeTaskId) {
  return (
    tasks.find(t => t.id === activeTaskId && !t.done) ||
    tasks.find(t => !t.done) ||
    null
  )
}

export function useTasks() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('sage-tasks')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [activeTaskId, setActiveTaskId] = useState(() => {
    const v = localStorage.getItem('sage-active-task')
    return v ? Number(v) : null
  })

  const tasksRef = useRef(tasks)

  // The list as it is saved right now. Every page has its own copy of this
  // hook, and a slow AI reply can arrive after another page has changed the
  // list, so working from this page's last-known copy would quietly undo
  // that change. Falls back to that copy only if the saved list can't be read.
  function latest() {
    try {
      const saved = JSON.parse(localStorage.getItem('sage-tasks'))
      if (Array.isArray(saved)) return saved
    } catch {
      // Unreadable: use what this page last knew.
    }
    return tasksRef.current
  }

  // Mutations compute the next state synchronously and write it to
  // localStorage in the same tick. Pages often navigate right after a
  // change, and React discards a pending state update when the component
  // unmounts, so neither effects nor updater functions can be trusted
  // to run before the next page reads localStorage.
  function commit(updater) {
    const next = updater(latest())
    tasksRef.current = next
    localStorage.setItem('sage-tasks', JSON.stringify(next))
    setTasks(next)
  }

  function persistActiveId(id) {
    if (id == null) localStorage.removeItem('sage-active-task')
    else localStorage.setItem('sage-active-task', String(id))
  }

  const activeTask = activeTaskOf(tasks, activeTaskId)

  // `source` records where the plan came from: 'ai' when a model wrote it,
  // 'sample' when the built-in plan stood in. It is stored on the task rather
  // than held in page state, because a plan that was a sample stays one after
  // a reload.
  function addTask(name, steps, prompt = '', source = 'ai') {
    const totalTime = steps.reduce((sum, s) => sum + (parseInt(s.time) || 0), 0)
    const newTask = {
      id: Date.now(),
      name,
      prompt,
      source,
      time: totalTime + ' min',
      done: false,
      steps,
      activeStepId: null,
      createdAt: new Date().toISOString(),
    }
    commit(prev => [newTask, ...prev])
    setActiveTaskId(newTask.id)
    persistActiveId(newTask.id)
    return newTask
  }

  function updateTask(taskId, patch) {
    commit(prev => prev.map(t => t.id === taskId ? { ...t, ...patch } : t))
  }

  // Change one step. `patch` is the fields to change, or a function from the
  // current step to them, for changes built on what's already there (adding
  // to a list) so they never work from a stale copy.
  function updateStep(taskId, stepId, patch) {
    commit(prev => prev.map(t => {
      if (t.id !== taskId) return t
      return {
        ...t,
        steps: t.steps.map(s => (s.id === stepId ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s)),
      }
    }))
  }

  function selectTask(taskId) {
    setActiveTaskId(taskId)
    persistActiveId(taskId)
  }

  function selectStep(taskId, stepId) {
    commit(prev => prev.map(t => t.id === taskId ? { ...t, activeStepId: stepId } : t))
  }

  function toggleStep(taskId, stepId) {
    // Decided from the same saved list commit will change, so the streak
    // credit always matches the tick that is actually written.
    const task = latest().find(t => t.id === taskId)
    const step = task?.steps.find(s => s.id === stepId)
    const becomingDone = step && !step.done
    // Does ticking this one finish the whole task? Worked out before the
    // change, so the celebration fires on the transition rather than on every
    // later tick of an already-finished task.
    const finishesTask =
      becomingDone &&
      !task.done &&
      task.steps.every(s => s.id === stepId || s.done)

    // Which day to take credit back from when unticking. A step saved
    // without a completedOn date has no day to return it to, so it is left
    // alone rather than guessing and docking the wrong date.
    const undoneOn = !becomingDone ? step?.completedOn : null

    commit(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const updatedSteps = t.steps.map(s => {
        if (s.id !== stepId) return s
        const nowDone = !s.done
        return { ...s, done: nowDone, completedOn: nowDone ? dateKey() : null }
      })
      const allDone = updatedSteps.length > 0 && updatedSteps.every(s => s.done)
      return { ...t, steps: updatedSteps, done: allDone }
    }))

    if (becomingDone) recordActivity()
    else removeActivity(undoneOn)
    // Whenever the confetti plays the whole task is done, and Sage plays her
    // task-complete; any other step ticked off gets her small nod.
    if (finishesTask) {
      celebrate()
      sayTaskDone()
      sageAnimation.complete('task')
    } else if (becomingDone) {
      sageAnimation.complete('step')
    }
  }

  // `steps` is the new list, or a function from the task's current steps to
  // it, for changes built on what's there now (breaking one step down) so a
  // tick made while waiting isn't undone. A function returning the same list,
  // or nothing, leaves the task as it is.
  function updateTaskSteps(taskId, nextSteps) {
    commit(prev => prev.map(t => {
      if (t.id !== taskId) return t
      let steps = nextSteps
      if (typeof nextSteps === 'function') {
        steps = nextSteps(t.steps)
        if (steps == null || steps === t.steps) return t
      }
      const totalTime = steps.reduce((sum, s) => sum + (parseInt(s.time) || 0), 0)
      const allDone = steps.length > 0 && steps.every(s => s.done)
      return { ...t, steps, time: totalTime + ' min', done: allDone }
    }))
  }

  function toggleTask(taskId) {
    const task = latest().find(t => t.id === taskId)
    const becomingDone = !task?.done
    // Crossing off a task finishes every step still outstanding, so it counts
    // for all of them rather than registering as a single piece of work.
    const stepsFinished = becomingDone
      ? task?.steps.filter(s => !s.done).length || 1
      : 0

    // Un-crossing a task undoes every step it had ticked, each returning its
    // credit to whichever day it was finished on.
    const undoneDays = becomingDone
      ? []
      : task?.steps.filter(s => s.done && s.completedOn).map(s => s.completedOn) || []

    commit(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const nowDone = !t.done
      const stamp = nowDone ? dateKey() : null
      const updatedSteps = t.steps.map(s => ({
        ...s,
        done: nowDone,
        completedOn: nowDone ? (s.completedOn || stamp) : null,
      }))
      return { ...t, steps: updatedSteps, done: nowDone }
    }))

    if (becomingDone) {
      recordActivity(stepsFinished)
      celebrate()
      sayTaskDone()
      sageAnimation.complete('task')
    } else {
      undoneDays.forEach(day => removeActivity(day))
    }
  }

  function deleteTask(taskId) {
    commit(prev => prev.filter(t => t.id !== taskId))
    if (taskId === activeTaskId) {
      setActiveTaskId(null)
      persistActiveId(null)
    }
  }

  return {
    tasks,
    activeTask,
    addTask,
    updateTask,
    selectTask,
    selectStep,
    toggleStep,
    updateTaskSteps,
    updateStep,
    toggleTask,
    deleteTask,
  }
}
