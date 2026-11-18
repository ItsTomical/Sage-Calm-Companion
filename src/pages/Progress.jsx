import StatCard from '../components/progress/StatCard.jsx'
import ActivityGrid from '../components/progress/ActivityGrid.jsx'
import { useProgressStats } from '../hooks/useProgressStats.js'
import { useStreak } from '../hooks/useStreak.js'
import flameIcon from '../assets/icons/flame.png'
import checkIcon from '../assets/icons/check.png'
import clockIcon from '../assets/icons/clock.png'
import lockIcon from '../assets/icons/lock.png'
import './Progress.css'

export default function Progress() {
  const { streak, best } = useStreak()
  const {
    xp,
    level,
    xpToNextLevel,
    levelProgress,
    xpRules,
    xpPerLevel,
    tasksCompleted,
    weekFocusHours,
    dayLevels,
    earliestDay,
    weekBars,
    badges,
    milestones,
    hasAnyActivity,
  } = useProgressStats()

  return (
    <div className="progress-page">
      <div className="progress-layout page-frame">

        {/* LEFT */}
        <aside className="prog-left">
          <div className="xp-card" data-tour="xp">
            <div className="section-label">Level {level}</div>
            <div className="xp-total">
              {xp.toLocaleString()} <span className="xp-label">XP</span>
            </div>
            <div className="xp-bar-wrap">
              <div className="xp-fill" style={{ width: `${levelProgress}%` }} />
            </div>
            <div className="xp-next">
              {xpToNextLevel.toLocaleString()} XP to level {level + 1}
            </div>

            {/* Always shown rather than behind a tap: a total means little
                without knowing what earned it. */}
            <div className="xp-how">
              <div className="xp-how-title">How XP works</div>
              <ul className="xp-rules">
                {xpRules.map((rule) => (
                  <li key={rule.label} className="xp-rule">
                    <span>{rule.label}</span>
                    <span className="xp-rule-val">+{rule.xp} XP</span>
                  </li>
                ))}
              </ul>
              <p className="xp-how-note">
                Every {xpPerLevel.toLocaleString()} XP is a new level. Levels stay
                the same size, so they never get harder to reach.
              </p>
            </div>
          </div>
        </aside>

        {/* CENTRE */}
        <main className="prog-centre">
          <div className="stat-grid" data-tour="stat-cards">
            <StatCard
              icon={flameIcon}
              value={streak}
              label="Day Streak"
              sub={`Personal best: ${best} ${best === 1 ? 'day' : 'days'}`}
            />
            <StatCard
              icon={checkIcon}
              value={tasksCompleted}
              label="Tasks Done"
              sub="All time"
            />
            <StatCard
              icon={clockIcon}
              value={`${weekFocusHours >= 10 ? Math.round(weekFocusHours) : weekFocusHours.toFixed(1)}h`}
              label="Focus Time"
              sub="This week"
            />
          </div>

          {!hasAnyActivity && (
            <div className="prog-empty">
              Nothing to show yet. Finish a step, run a focus session or write a
              reflection, and it will appear here.
            </div>
          )}

          {/* Weekly bar chart */}
          <div className="bar-chart-card" data-tour="week-chart">
            <div className="section-label">FOCUS TIME THIS WEEK</div>
            <div className="bar-chart">
              {weekBars.map((b, i) => (
                <div key={i} className="bar-col">
                  <div
                    className={[
                      'bar-fill-anim',
                      b.today ? 'bar-today' : '',
                      b.future ? 'bar-future' : '',
                    ].filter(Boolean).join(' ')}
                    style={{ height: `${b.height}%` }}
                  />
                  <div className="bar-day-lbl">{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Month-by-month activity calendar */}
          <ActivityGrid dayLevels={dayLevels} earliestDay={earliestDay} />
        </main>

        {/* RIGHT */}
        <aside className="prog-right">
          <div className="section-label">BADGES</div>
          <p className="badges-note">
            Small markers along the way. There’s no deadline on any of them.
          </p>
          <div className="badges-grid" data-tour="badges">
            {badges.map((badge) => (
              // role="img" makes each tile one announcement, read from the
              // label, instead of an icon, a name and a line read separately.
              <div
                key={badge.id}
                className={`badge-item${badge.earned ? '' : ' locked'}`}
                role="img"
                aria-label={`${badge.name}: ${badge.earned ? 'earned' : 'not earned yet'}. ${badge.how}`}
              >
                <div className="badge-ico"><img src={badge.icon} alt="" /></div>
                <div className="badge-name">{badge.name}</div>
                <div className="badge-how">{badge.how}</div>
                {!badge.earned && <img src={lockIcon} alt="" className="badge-lock" />}
              </div>
            ))}
          </div>

          <div data-tour="milestones">
            <div className="section-label" style={{ marginTop: 22 }}>MILESTONES</div>
            {milestones.map((m, i) => (
              <div key={i} className="milestone-item">
                <div className="milestone-row">
                  <span className="milestone-label">{m.label}</span>
                  <span className="milestone-pct">{m.value}%</span>
                </div>
                <div className="milestone-bar">
                  <div className="milestone-fill" style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  )
}
