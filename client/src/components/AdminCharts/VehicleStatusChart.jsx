import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#999',
        font: { family: 'Barlow Condensed, sans-serif', size: 12 },
        usePointStyle: true,
        pointStyleWidth: 8,
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: '#111',
      borderColor: '#1e1e1e',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#ccc',
      callbacks: {
        label: ctx => ` ${ctx.parsed} véhicule${ctx.parsed > 1 ? 's' : ''} (${Math.round(ctx.parsed / ctx.dataset.data.reduce((a, b) => a + b, 0) * 100)}%)`,
      },
    },
  },
}

export default function VehicleStatusChart({ available, reserved, sold }) {
  const total = available + reserved + sold

  const data = {
    labels: ['Disponibles', 'Réservés', 'Vendus'],
    datasets: [{
      data: [available, reserved, sold],
      backgroundColor: ['#e8000d', '#EF9F27', '#555'],
      borderColor: '#0d0d0d',
      borderWidth: 3,
      hoverBorderColor: '#0d0d0d',
    }],
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">Parc véhicules</div>
        <div className="chart-total">{total} au total</div>
      </div>
      <div className="chart-body">
        <Doughnut data={data} options={OPTIONS} />
      </div>
    </div>
  )
}
