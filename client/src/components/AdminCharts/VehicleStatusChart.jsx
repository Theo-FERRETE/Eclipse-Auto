// Véhicules par statut (anneau Chart.js).

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
} from 'chart.js'

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
        padding: 16,
        boxWidth: 10,
      },
    },
    tooltip: {
      backgroundColor: '#111',
      borderColor: '#1e1e1e',
      borderWidth: 1,
      titleColor: '#999',
      bodyColor: '#fff',
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
      borderColor: '#0a0a0a',
      borderWidth: 2,
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
