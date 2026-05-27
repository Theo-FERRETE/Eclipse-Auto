import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111',
      borderColor: '#1e1e1e',
      borderWidth: 1,
      titleColor: '#999',
      bodyColor: '#fff',
      callbacks: {
        label: ctx => ` ${ctx.parsed.y} réservation${ctx.parsed.y > 1 ? 's' : ''}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#999',
        font: { family: 'Barlow Condensed, sans-serif', size: 12 },
      },
      border: { color: '#1e1e1e' },
    },
    y: {
      grid: { color: '#1a1a1a' },
      ticks: {
        color: '#999',
        font: { family: 'Barlow Condensed, sans-serif', size: 12 },
        stepSize: 1,
        precision: 0,
      },
      border: { color: '#1e1e1e' },
      beginAtZero: true,
    },
  },
}

export default function ReservationStatusChart({ pending, confirmed, cancelled }) {
  const total = pending + confirmed + cancelled

  const data = {
    labels: ['En attente', 'Confirmées', 'Annulées'],
    datasets: [{
      data: [pending, confirmed, cancelled],
      backgroundColor: ['#EF9F27', '#22c55e', '#444'],
      borderRadius: 2,
      borderSkipped: false,
    }],
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">Réservations</div>
        <div className="chart-total">{total} au total</div>
      </div>
      <div className="chart-body">
        <Bar data={data} options={OPTIONS} />
      </div>
    </div>
  )
}
