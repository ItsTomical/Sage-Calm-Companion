import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import TaskSidebar from '../components/tasks/TaskSidebar.jsx'
import AIInputCard from '../components/tasks/AIInputCard.jsx'
import StepRow from '../components/tasks/StepRow.jsx'
import StepLogModal from '../components/tasks/StepLogModal.jsx'
import SageMark from '../components/companion/SageMark.jsx'
import { useTasks, currentStepOf } from '../hooks/useTasks.js'
import { breakDownTask, expandStep } from '../services/aiService.js'
import { useSageAnimation } from '../hooks/useSageAnimation.js'
import { mapStepForUI, replaceStep } from '../utils/steps.js'
import clipboardIcon from '../assets/icons/clipboard.png'
import { clickable } from '../utils/a11y.js'
import './Tasks.css'

export default function Tasks() {
  const { tasks, activeTask, addTask, updateTask, selectTask, selectStep, toggleStep, updateTaskSteps, updateStep, toggleTask, deleteTask } = useTasks()
  const sage = useSageAnimation()
  const location = useLocation()
  const [viewId, setViewId]           = useState(null)
  const [composing, setComposing]     = useState(Boolean(location.state?.compose))
  const [taskInput, setTaskInput]     = useState('')
  const [loading, setLoading]         = useState(false)
  const [expandingId, setExpandingId] = useState(null)
  const [error, setError]             = useState(null)
  const [encouragement, setEncouragement] = useState(null)
  const [briefOpen, setBriefOpen]     = useState(false)
  const [briefText, setBriefText]     = useState('')
  const [addingStep, setAddingStep]   = useState(false)
  const [stepDraft, setStepDraft]     = useState({ title: '', desc: '', time: '15 min' })
  const [logStepId, setLogStepId]     = useState(null) // step whose work log is open

  // Each AI request takes a ticket when it starts, and choosing another task
  // or starting a new one moves the ticket on. A reply holding an old ticket
  // still saves its plan to the task it was asked for, but leaves the screen
  // alone, so its message (or a jump to its task) can't land on whatever the
  // person has moved on to.
  const requestRef = useRef(0)
  // The ticket of the newest request that turned the shimmer on. Only that
  // one turns it off, so an older reply can't hide a newer one still running.
  const loadingRef = useRef(0)

  // The task on screen: an explicit local choice, else the app-wide active task.
  const viewTask = tasks.find(t => t.id === viewId) || activeTask
  const steps = viewTask?.steps ?? []
  const currentStepId = currentStepOf(viewTask)?.id

  // Keep the brief editor in sync with whichever task is on screen.
  useEffect(() => {
    setBriefText(viewTask?.prompt || viewTask?.name || '')
    setBriefOpen(false)
    setAddingStep(false)
  }, [viewTask?.id])

  function handleSelectTask(task) {
    requestRef.current += 1
    setViewId(task.id)
    selectTask(task.id)
    setComposing(false)
    setError(null)
    setEncouragement(null)
  }

  function handleNewTask() {
    requestRef.current += 1
    setComposing(true)
    setTaskInput('')
    setError(null)
    setEncouragement(null)
  }

  async function handleBreakdown() {
    if (!taskInput.trim()) return
    const token = ++requestRef.current
    loadingRef.current = token
    setLoading(true)
    setError(null)
    // Sage thinks until the reply is back, whatever it says.
    const result = await sage.thinkWhile(breakDownTask(taskInput))
    const current = token === requestRef.current
    if (result.status === 'needs_clarification') {
      if (current) setError(result.message)
    } else if (result.status === 'error') {
      if (current) setError(result.message || 'Something went wrong. Try again.')
    } else {
      // Saved whatever happened meanwhile, even if this page has since closed.
      const mapped = result.steps.map(mapStepForUI)
      const taskName = result.title || taskInput.trim()
      const saved = addTask(taskName, mapped, taskInput.trim(), result.source)
      if (current) {
        setViewId(saved.id)
        setComposing(false)
        setEncouragement(result.encouragement || null)
      }
    }
    if (token === loadingRef.current) setLoading(false)
  }

  async function handleRebreak() {
    if (!briefText.trim() || !viewTask) return
    const hasProgress = steps.some(s => s.done)
    if (hasProgress && !window.confirm('Re-breaking this task will replace its current steps, including completed ones. Continue?')) {
      return
    }
    const token = ++requestRef.current
    loadingRef.current = token
    setLoading(true)
    setError(null)
    const result = await sage.thinkWhile(breakDownTask(briefText))
    const current = token === requestRef.current
    if (result.status === 'needs_clarification') {
      if (current) setError(result.message)
    } else if (result.status === 'error') {
      if (current) setError(result.message || 'Something went wrong. Try again.')
    } else {
      // viewTask here is the task this was started for, not the one on screen now.
      const mapped = result.steps.map(mapStepForUI)
      updateTaskSteps(viewTask.id, mapped)
      updateTask(viewTask.id, {
        name: result.title || viewTask.name,
        prompt: briefText.trim(),
        source: result.source,
        activeStepId: null,
      })
      if (current) {
        setEncouragement(result.encouragement || null)
        setBriefOpen(false)
      }
    }
    if (token === loadingRef.current) setLoading(false)
  }

  async function handleExpand(step) {
    if (expandingId || !viewTask) return
    const token = ++requestRef.current
    setExpandingId(step.id)
    setError(null)
    const result = await sage.thinkWhile(expandStep(viewTask.name, steps.map(s => s.title), step.title))
    const current = token === requestRef.current
    // Ids are positions, so by now this id may belong to a different step;
    // the reply is only used if it's still the step that was asked about.
    const isSameStep = saved => saved.find(s => s.id === step.id)?.title === step.title
    // Built on the steps as saved now, so a tick made while waiting stays.
    if (result.status === 'needs_clarification') {
      if (current) setError(result.message)
      updateTaskSteps(viewTask.id, saved => {
        if (!isSameStep(saved)) return saved
        return saved.map(s => s.id === step.id ? { ...s, expandable: false } : s)
      })
    } else if (result.status === 'error') {
      if (current) setError(result.message || 'Something went wrong. Try again.')
    } else {
      const subSteps = result.steps.map(mapStepForUI)
      let applied = false
      updateTaskSteps(viewTask.id, saved => {
        if (!isSameStep(saved)) return saved
        applied = true
        return replaceStep(saved, step.id, subSteps)
      })
      if (current && applied && result.encouragement) setEncouragement(result.encouragement)
    }
    // Only one expansion runs at a time (see the guard above), so this is
    // always the one that set it.
    setExpandingId(null)
  }

  function handleStartStep(step) {
    selectTask(viewTask.id)
    selectStep(viewTask.id, step.id)
  }

  function handleEditStep(step, patch) {
    const newSteps = steps.map(s => s.id === step.id ? { ...s, ...patch } : s)
    updateTaskSteps(viewTask.id, newSteps)
  }

  function handleDeleteStep(step) {
    const newSteps = steps
      .filter(s => s.id !== step.id)
      .map((s, i) => ({ ...s, id: i + 1 }))
    updateTaskSteps(viewTask.id, newSteps)
  }

  function handleAddStep() {
    if (!stepDraft.title.trim()) return
    const minutes = parseInt(stepDraft.time) || 15
    const newStep = {
      title: stepDraft.title.trim(),
      desc: stepDraft.desc.trim(),
      detail: stepDraft.desc.trim(),
      time: `${minutes} min`,
      done: false,
      expandable: false,
    }
    const newSteps = [...steps, newStep].map((s, i) => ({ ...s, id: i + 1 }))
    updateTaskSteps(viewTask.id, newSteps)
    setStepDraft({ title: '', desc: '', time: '15 min' })
    setAddingStep(false)
  }

  const totalTime = steps.reduce((sum, s) => sum + (parseInt(s.time) || 0), 0)
  const isViewing = !composing && viewTask !== null && steps.length > 0

  // The task being viewed leads the sidebar; the rest keep their stored order.
  const orderedTasks = viewTask
    ? [viewTask, ...tasks.filter(t => t.id !== viewTask.id)]
    : tasks

  // Loading comes first so an older encouragement doesn't linger while a new plan is made.
  const sageMessage = loading
    ? '"Give me a moment. I’m thinking this through."'
    : encouragement
      ? `"${encouragement}"`
      : isViewing
        ? '"I\'ve structured this task into clear steps. You just need to begin."'
        : '"Tell me what you\'ve been putting off. We\'ll break it down together."'

  return (
    <div className="tasks-page">
      <div className="tasks-layout page-frame">
        <TaskSidebar
          tasks={orderedTasks}
          activeId={viewTask?.id}
          onSelect={handleSelectTask}
          onAdd={handleNewTask}
          onToggle={toggleTask}
          onDelete={(id) => {
            deleteTask(id)
            if (viewId === id) setViewId(null)
          }}
        />

        <div className={`tl-content${!isViewing && !loading ? ' composing' : ''}`}>
          <div className="sage-banner" data-tour="sage-banner">
            <SageMark size="sm" />
            <div className="sage-banner-msg">{sageMessage}</div>
          </div>

          {error && (
            <div className="sage-error">
              <SageMark size="xs" />
              <span>{error}</span>
            </div>
          )}

          {isViewing && !loading && viewTask.source === 'sample' && (
            <div className="sage-sample">
              <SageMark size="sm" />
              <span>
                Sage couldn't be reached, so this is a general starting plan
                rather than one written for your task. Edit any step to make it
                yours.
              </span>
            </div>
          )}

          {!isViewing && !loading && (
            <AIInputCard
              value={taskInput}
              onChange={setTaskInput}
              onBreakdown={handleBreakdown}
              loading={loading}
            />
          )}

          {loading && (
            <div className="shim-card">
              <div className="shim-status" role="status" aria-live="polite">
                Sage is thinking… this can take up to a minute.
              </div>
              <div className="shim-line" style={{ width: '60%' }} />
              <div className="shim-line" style={{ width: '80%' }} />
              <div className="shim-line" style={{ width: '50%' }} />
              <div className="shim-line" style={{ width: '70%', marginTop: 16 }} />
              <div className="shim-line" style={{ width: '55%' }} />
            </div>
          )}

          {isViewing && !loading && (
            <div className={`brief-tile${briefOpen ? ' open' : ''}`} data-tour="brief">
              <div className="brief-head" aria-expanded={briefOpen} {...clickable(() => setBriefOpen(o => !o))}>
                <span className="brief-label">Original brief</span>
                <span className="brief-preview">{!briefOpen ? (viewTask.prompt || viewTask.name) : ''}</span>
                <span className="brief-chevron">›</span>
              </div>
              {briefOpen && (
                <div className="brief-body">
                  <textarea
                    className="brief-ta"
                    rows={4}
                    value={briefText}
                    onChange={(e) => setBriefText(e.target.value)}
                  />
                  <div className="brief-actions">
                    <span className="brief-hint">Editing this and re-breaking will replace the current steps.</span>
                    <button className="break-btn" onClick={handleRebreak} disabled={loading}>
                      {loading ? 'Thinking…' : 'Break it down again'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isViewing && !loading && (
            <div className="steps-card" data-tour="steps-card">
              {/* The heading scrolls with (and pins above) the steps, so its
                  column lines up with theirs whether or not a scrollbar shows. */}
              <div className="steps-scroll">
              <div className="steps-head">
                <div className="steps-head-info">
                  <strong>{viewTask.name}</strong>
                  <span>{steps.length} steps · est. {totalTime} min</span>
                  {viewTask.source === 'ai' && (
                    <span
                      className="plan-source"
                      title="An AI model wrote this plan. You can edit any step to make it yours."
                    >
                      Planned by Sage (AI)
                    </span>
                  )}
                </div>
                <div className="steps-log-head" data-tour="work-log">Work notes &amp; distractions</div>
              </div>
              {steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  isCurrent={step.id === currentStepId}
                  onToggle={(s) => toggleStep(viewTask.id, s.id)}
                  onExpand={handleExpand}
                  onStart={handleStartStep}
                  onEdit={handleEditStep}
                  onDelete={handleDeleteStep}
                  onOpenLog={(s) => setLogStepId(s.id)}
                  expanding={expandingId === step.id}
                />
              ))}

              {addingStep ? (
                <div className="add-step-form">
                  <input
                    className="se-input se-title"
                    value={stepDraft.title}
                    onChange={(e) => setStepDraft(d => ({ ...d, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                  <textarea
                    className="se-input se-desc"
                    rows={2}
                    value={stepDraft.desc}
                    onChange={(e) => setStepDraft(d => ({ ...d, desc: e.target.value }))}
                    placeholder="Short description (optional)"
                  />
                  <div className="add-step-actions">
                    <input
                      className="se-input se-time"
                      value={stepDraft.time}
                      onChange={(e) => setStepDraft(d => ({ ...d, time: e.target.value }))}
                      placeholder="15 min"
                    />
                    <div className="step-btns">
                      <button className="se-btn" onClick={() => setAddingStep(false)}>Cancel</button>
                      <button className="se-btn se-save" onClick={handleAddStep}>Add step</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="add-step-row" {...clickable(() => setAddingStep(true))}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add step
                </div>
              )}
              </div>
            </div>
          )}

          {!loading && !isViewing && tasks.length === 0 && !error && (
            <div className="empty-state">
              <img src={clipboardIcon} alt="" className="empty-icon" />
              <div className="empty-title">No tasks yet</div>
              <div className="empty-desc">Type something you've been putting off above and Sage will break it down for you.</div>
            </div>
          )}
        </div>
      </div>

      {/* Reads the live step, so edits and removals show straight away. */}
      <StepLogModal
        step={logStepId != null ? steps.find(s => s.id === logStepId) : null}
        onClose={() => setLogStepId(null)}
        onSaveNotes={(notes) => updateStep(viewTask.id, logStepId, { notes })}
        onRemoveDistraction={(at) =>
          updateStep(viewTask.id, logStepId, s => ({ distractions: (s.distractions ?? []).filter(d => d.at !== at) }))}
      />
    </div>
  )
}
