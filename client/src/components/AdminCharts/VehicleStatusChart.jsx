export default function VehicleStatusChart({ available, reserved, sold }) {
  const total = available + reserved + sold

  const segments = [
    { label: 'Disponibles', value: available, color: '#e8000d' },
    { label: 'Réservés', value: reserved, color: '#EF9F27' },
    { label: 'Vendus', value: sold, color: '#555' },
  ]

  let cumulative = 0
  const gradient = total
    ? segments.map(s => {
        const start = cumulative
        cumulative += (s.value / total) * 100
        return `${s.color} ${start}% ${cumulative}%`
      }).join(', ')
    : '#1e1e1e 0%, #1e1e1e 100%'

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">Parc véhicules</div>
        <div className="chart-total">{total} au total</div>
      </div>
      <div className="chart-body chart-body--donut">
        <div className="donut" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="donut-hole"></div>
        </div>
        <ul className="chart-legend">
          {segments.map(s => (
            <li key={s.label}>
              <span className="legend-dot" style={{ background: s.color }}></span>
              {s.label} <strong>{s.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
