import TodayTasks from '../components/dashboard/TodayTasks.jsx'
import NextStepCard from '../components/dashboard/NextStepCard.jsx'
import MoodPanel from '../components/dashboard/MoodPanel.jsx'
import { saySage } from '../components/companion/FloatingSage.jsx'
import { useTasks, currentStepOf } from '../hooks/useTasks.js'
import { useStreak } from '../hooks/useStreak.js'
import { useFocusStats } from '../hooks/useFocusStats.js'
import { useMood } from '../hooks/useMood.js'
import { useSageAnimation } from '../hooks/useSageAnimation.js'
import { expandStep } from '../services/aiService.js'
import { mapStepForUI, replaceStep } from '../utils/steps.js'
import NudgeCard from '../components/dashboard/NudgeCard.jsx'
import { withName } from '../utils/userName.js'
import { clickable } from '../utils/a11y.js'
import './Dashboard.css'

// What Sage says when a mood is picked. With a name set in Settings she
// uses it (a warm moment); without one the lines read without it.
// `n` is ', Alex' or ''.
const moodBubbles = {
  Low:   (n) => `"Hard days happen${n}. Sage is with you. Just this one step."`,
  Meh:   (n) => `"That's okay${n}. Even one small step counts. I'm right here."`,
  Ok:    (n) => `"Let's start this together${n}. Just one step at a time."`,
  Good:  (n) => `"Wonderful energy${n}! Let's make the most of it. Start now."`,
  Great: (n) => `"You're glowing${n}! Sage is excited to do this with you."`,
}

export default function Dashboard() {
  const { tasks, activeTask, selectTask, selectStep, toggleStep, toggleTask, deleteTask, updateTaskSteps } = useTasks()
  const { streak, best, weekDays } = useStreak()
  const { todaySeconds, weekBars, focusNum, focusLbl } = useFocusStats()
  const { selectedMood, selectMood } = useMood()
  const sage = useSageAnimation()

  const handleMoodSelect = (mood) => {
    selectMood(mood)
    saySage(moodBubbles[mood](withName(name => `, ${name}`, '')))
    // Her reaction to it (ignored if she's busy; the mood still saves).
    sage.react(mood)
  }

  const nextStep = currentStepOf(activeTask)

  // "Not ready? → Break it down smaller": the same AI as the Tasks page's
  // Break down, done here so someone who's stuck doesn't have to go anywhere.
  // The card shows what happened, so this reports back rather than showing
  // anything itself.
  async function handleBreakDown() {
    const task = activeTask
    const step = nextStep
    const result = await sage.thinkWhile(expandStep(task.name, task.steps.map(s => s.title), step.title))
    // Ids are positions, so by now this id may belong to a different step;
    // the reply is only used if it's still the step that was asked about.
    const isSameStep = saved => saved.find(s => s.id === step.id)?.title === step.title

    // Both changes are built on the steps as saved now, so a tick made while
    // waiting stays.
    if (result.status === 'success') {
      const subSteps = result.steps.map(mapStepForUI)
      let applied = false
      updateTaskSteps(task.id, saved => {
        if (!isSameStep(saved)) return saved
        applied = true
        return replaceStep(saved, step.id, subSteps)
      })
      if (!applied) {
        return {
          status: 'error',
          message: 'That step changed while I was working on it. Try again when you’re ready.',
        }
      }
      saySage(result.encouragement || 'Smaller now. Just this one.')
      return { status: 'success' }
    }
    if (result.status === 'needs_clarification') {
      // Remembered, as on the Tasks page, so it isn't offered again.
      updateTaskSteps(task.id, saved => {
        if (!isSameStep(saved)) return saved
        return saved.map(s => (s.id === step.id ? { ...s, expandable: false } : s))
      })
      return { status: 'small', message: result.message }
    }
    // The service's own wording says why (taking longer, busy), so it leads
    // when there is one.
    return {
      status: 'error',
      message: result.message
        ? `${result.message} A slow breath might help in the meantime.`
        : 'I couldn’t break this down just now. A slow breath might help in the meantime.',
    }
  }

  // Active task leads the list; the rest keep their stored order.
  const orderedTasks = activeTask
    ? [activeTask, ...tasks.filter(t => t.id !== activeTask.id)]
    : tasks

  const completedSteps  = activeTask?.steps?.filter(s => s.done).length || 0
  const totalSteps      = activeTask?.steps?.length || 0
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <div className="dashboard-page">
      <div className="dash-app">
        <TodayTasks
          tasks={orderedTasks}
          activeId={activeTask?.id}
          onSelect={(task) => selectTask(task.id)}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />

        <section className="centre-panel">
          <NextStepCard
            task={activeTask}
            step={nextStep}
            onBreakDown={handleBreakDown}
          />

          {activeTask && (
            <div className="progress-section" data-tour="task-progress">
              <div className="progress-section-head">
                <span className="section-label" style={{ margin: 0 }}>Task progress</span>
                <span className="progress-count">{completedSteps} of {totalSteps} steps</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="progress-steps-list">
                {activeTask.steps.map((s, i) => (
                  <div
                    key={s.id}
                    className={[
                      'ps-item',
                      s.done ? 'ps-done' : '',
                      s.id === nextStep?.id ? 'ps-current' : '',
                    ].filter(Boolean).join(' ')}
                    title={s.done ? '' : 'Work on this step'}
                    {...clickable(() => { if (!s.done) selectStep(activeTask.id, s.id) })}
                  >
                    <div
                      className="ps-num"
                      title={s.done ? 'Mark as not done' : 'Mark as done'}
                      aria-label={s.done ? 'Mark as not done' : 'Mark as done'}
                      {...clickable((e) => { e.stopPropagation(); toggleStep(activeTask.id, s.id) })}
                    >
                      {s.done ? '✓' : i + 1}
                    </div>
                    <div className="ps-title">{s.title}</div>
                    <div className="ps-time">{s.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <MoodPanel
          selectedMood={selectedMood}
          onSelectMood={handleMoodSelect}
          streakData={{ streak, best, weekDays, weekBars, focusNum, focusLbl }}
        >
          <NudgeCard
            mood={selectedMood}
            task={activeTask}
            step={nextStep}
            done={completedSteps}
            total={totalSteps}
            streak={streak}
            focusedToday={todaySeconds > 0}
            hour={new Date().getHours()}
          />
        </MoodPanel>
      </div>
    </div>
  )
}
