import { useState } from 'react'
import Button from '../ui/Button.jsx'
import { clickable } from '../../utils/a11y.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { COMPACT } from '../../utils/breakpoints.js'
import './TaskSidebar.css'

export default function TaskSidebar({ tasks, activeId, onSelect, onAdd, onToggle, onDelete }) {
  // On phones and tablets the list sits above the steps, so it folds to one
  // line like Today on the dashboard. Open to begin with only when there is
  // nothing to show below it yet.
  const isCompact = useMediaQuery(COMPACT)
  const [open, setOpen] = useState(tasks.length === 0)
  const showList = !isCompact || open

  // Picking a task or starting a new one folds the list away on smaller
  // screens, so what it opened is what's in view.
  function fold(action) {
    return (...args) => {
      action(...args)
      setOpen(false)
    }
  }

  const count = <div className="tl-count">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</div>

  return (
    <aside className="tl-sidebar" data-tour="task-list">
      {isCompact ? (
        <button
          className="tl-header tl-toggle"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          <span className="tl-title">My Tasks</span>
          {count}
          <svg className="tl-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      ) : (
        <div className="tl-header">
          <div className="tl-title">My Tasks</div>
          {count}
        </div>
      )}

      {/* The same primary button as on the dashboard, in the same place:
          under the header, and still there when the list is folded. */}
      <Button variant="primary" className="tl-add-row" onClick={fold(onAdd)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add a task
      </Button>

      {showList && (<>
      <div className="tl-list">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={[
            'tl-item',
            task.done ? 'tl-done-item' : '',
            activeId === task.id ? 'tl-active' : '',
          ].filter(Boolean).join(' ')}
          {...clickable(fold(() => onSelect(task)))}
        >
          <div
            className="tl-check"
            title={task.done ? 'Mark as not done' : 'Mark as done'}
            aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
            {...clickable((e) => { e.stopPropagation(); onToggle(task.id) })}
          >
            <div className="tl-check-dot" />
          </div>

          <div className="tl-info">
            <div className="tl-name">
              {task.name}
              {activeId === task.id && <span className="tl-active-label">Active</span>}
            </div>
            <div className="tl-meta">
              <span className="tl-time">{task.time}</span>
              {task.steps?.length > 0 && (
                <span className="tl-steps-count">{task.steps.length} steps</span>
              )}
            </div>
          </div>

          <button
            className="tl-delete"
            title="Remove task"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          >
            ×
          </button>
        </div>
      ))}
      </div>
      </>)}
    </aside>
  )
}
