export default function ReservationStatusChart({ pending, confirmed, cancelled }) {
  const total = pending + confirmed + cancelled
  const max = Math.max(1, pending, confirmed, cancelled)

  const segments = [
    { label: 'En attente', value: pending, color: '#EF9F27' },
    { label: 'Confirmées', value: confirmed, color: '#22c55e' },
    { label: 'Annulées', value: cancelled, color: '#444' },
  ]

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">Réservations</div>
        <div className="chart-total">{total} au total</div>
      </div>
      <div className="chart-body chart-body--bars">
        {segments.map(s => (
          <div className="bar-col" key={s.label}>
            <span className="bar-value">{s.value}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${(s.value / max) * 100}%`, background: s.color }}></div>
            </div>
            <span className="bar-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
