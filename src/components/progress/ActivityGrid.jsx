import { useState } from 'react'
import { dateKey } from '../../hooks/useStreak.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { PHONE } from '../../utils/breakpoints.js'
import './ActivityGrid.css'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHOWN = 3

// A month laid out as calendar weeks, Monday first. Leading and trailing
// blanks keep the columns lined up with the day labels.
function monthCells(year, month) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // Monday-based offset

  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function monthsBetween(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

export default function ActivityGrid({ dayLevels = {}, earliestDay = null }) {
  // How many months back the middle of the window has moved. 0 shows the
  // current month in the centre.
  const [offset, setOffset] = useState(0)
  const isPhone = useMediaQuery(PHONE)

  const today = new Date()
  const todayKey = dateKey(today)

  // Back stops at the month of the first recorded day, so the arrows don't
  // page into blank years. Forward stops at 0, because the default window
  // already shows next month on the right and there is nothing beyond it.
  const earliest = earliestDay ? new Date(`${earliestDay}T12:00:00`) : today
  const maxOffset = Math.max(0, monthsBetween(earliest, today))
  const canGoBack = offset < maxOffset
  const canGoForward = offset > 0

  const months = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    // i = 0 is the left-hand month, so the centre sits one step ahead of it.
    const d = new Date(today.getFullYear(), today.getMonth() - offset - 1 + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const first = months[0]
  const last = months[months.length - 1]
  const centre = months[1]
  // A phone shows only the middle month (ActivityGrid.css), so the label
  // names just that one; the arrows already move one month at a time.
  const rangeLabel = isPhone
    ? `${MONTH_NAMES[centre.month]} ${centre.year}`
    : first.year === last.year
      ? `${MONTH_NAMES[first.month].slice(0, 3)} – ${MONTH_NAMES[last.month].slice(0, 3)} ${last.year}`
      : `${MONTH_NAMES[first.month].slice(0, 3)} ${first.year} – ${MONTH_NAMES[last.month].slice(0, 3)} ${last.year}`

  return (
    <div className="p-card" data-tour="activity-grid">
      <div className="act-head">
        <div className="p-card-label">Activity</div>
        <div className="act-nav">
          <button
            className="act-arrow"
            onClick={() => setOffset(o => o + 1)}
            disabled={!canGoBack}
            aria-label={isPhone ? 'Show the previous month' : 'Show earlier months'}
          >
            ‹
          </button>
          <span className="act-range">{rangeLabel}</span>
          <button
            className="act-arrow"
            onClick={() => setOffset(o => o - 1)}
            disabled={!canGoForward}
            aria-label={isPhone ? 'Show the next month' : 'Show later months'}
          >
            ›
          </button>
        </div>
      </div>

      <div className="act-months">
        {months.map(({ year, month }) => {
          const isCurrent = year === today.getFullYear() && month === today.getMonth()
          return (
            <div key={`${year}-${month}`} className={`act-month${isCurrent ? ' act-month-now' : ''}`}>
              <div className="act-month-name">{MONTH_NAMES[month]}</div>
              <div className="act-dow">
                {DAY_LABELS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="act-days">
                {monthCells(year, month).map((date, i) => {
                  if (!date) return <span key={i} className="act-d act-blank" />
                  const key = dateKey(date)
                  const level = dayLevels[key] || 'l0'
                  const classes = [
                    'act-d',
                    level,
                    key === todayKey ? 'act-today' : '',
                    date > today ? 'act-future' : '',
                  ].filter(Boolean).join(' ')
                  return <span key={i} className={classes} title={key} />
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="act-legend">
        <span>Less</span>
        <span className="act-d l0" />
        <span className="act-d l1" />
        <span className="act-d l2" />
        <span className="act-d l3" />
        <span className="act-d l4" />
        <span>More</span>
      </div>
    </div>
  )
}
