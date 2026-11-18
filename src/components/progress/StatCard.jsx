import './StatCard.css'

export default function StatCard({ icon, value, label, sub }) {
  return (
    <div className="stat-card">
      <img src={icon} alt="" className="stat-ico" />
      <div className="stat-num">{value}</div>
      <div className="stat-lbl">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
