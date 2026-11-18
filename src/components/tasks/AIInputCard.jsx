import './AIInputCard.css'

export default function AIInputCard({ value, onChange, onBreakdown, loading }) {
  return (
    <div className="ai-input-card" data-tour="task-input">
      <div className="ai-input-label">What do you need to do?</div>
      <textarea
        className="ai-input-ta"
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your task…"
      />
      <div className="ai-input-footer">
        <div className="ai-note">
          <div className="ai-dot" />
          Sage will structure this for you
        </div>
        <button className="break-btn" onClick={onBreakdown} disabled={loading}>
          {loading ? 'Thinking…' : 'Break it down'}
        </button>
      </div>
    </div>
  )
}
