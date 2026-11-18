import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Panel from '../ui/Panel.jsx'
import Button from '../ui/Button.jsx'
import { clickable } from '../../utils/a11y.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { COMPACT } from '../../utils/breakpoints.js'
import './TodayTasks.css'

export default function TodayTasks({ tasks, activeId, onSelect, onToggle, onDelete }) {
  const navigate = useNavigate()
  // On phones and tablets the list sits above Next Step, so it starts
  // folded to one line and opens on a tap. Desktop always shows it.
  const isCompact = useMediaQuery(COMPACT)
  const [open, setOpen] = useState(false)
  const showList = !isCompact || open

  const count = <div className="task-count">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</div>

  // The first thing anyone needs to do, so it gets the same primary button
  // as Start Now. At the top of the card on desktop; on smaller screens its
  // own row under Today and Mood, so it's there even with the list folded.
  const addRow = (
    <Button
      variant="primary"
      className="add-task-row"
      data-tour="add-task"
      onClick={() => navigate('/tasks', { state: { compose: true } })}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Add a task
    </Button>
  )

  return (
    <aside className="left-panel">
      <Panel data-tour="today-tasks">
        {isCompact ? (
          <button
            className="today-header today-toggle"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
          >
            <span className="today-label">Today</span>
            {count}
            <svg className="today-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ) : (
          <div className="today-header">
            <div className="today-label">Today</div>
            {count}
          </div>
        )}

        {!isCompact && addRow}

        {showList && (
        <div className="today-list">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={[
              'task-item',
              task.done ? 'done-t' : '',
              task.id === activeId ? 'active' : '',
            ].filter(Boolean).join(' ')}
            title={task.done ? '' : 'Make this the active task'}
            {...clickable(() => {
              if (task.done) return
              onSelect(task)
              setOpen(false) // fold away so the new Next Step is in view
            })}
          >
            <div
              className="task-check"
              title={task.done ? 'Mark as not done' : 'Mark as done'}
              aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
              {...clickable((e) => { e.stopPropagation(); onToggle(task.id) })}
            >
              <div className="task-check-inner" />
            </div>
            <div className="task-info">
              <div className="task-name">{task.name}</div>
              <div className="task-meta">
                <span className="task-time">{task.time}</span>
              </div>
            </div>
            <button
              className="task-delete"
              title="Remove task"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
            >
              ×
            </button>
          </div>
        ))}
        </div>
        )}

      </Panel>
      {isCompact && addRow}
    </aside>
  )
}
