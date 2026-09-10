// Chiffre d'affaires des ventes confirmées, par mois (barres Chart.js).

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
        label: ctx => ` € ${ctx.parsed.y.toLocaleString('fr-FR')}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#999',
        font: { family: 'Inter, sans-serif', size: 12 },
      },
      border: { color: '#1e1e1e' },
    },
    y: {
      grid: { color: '#1a1a1a' },
      ticks: {
        color: '#999',
        font: { family: 'Inter, sans-serif', size: 12 },
        callback: v => `€ ${v.toLocaleString('fr-FR')}`,
      },
      border: { color: '#1e1e1e' },
      beginAtZero: true,
    },
  },
}

// "2026-03" -> "Mars 2026"
function formatMonth(key) {
  const [year, month] = key.split('-')
  const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function VentesParMoisChart({ parMois }) {
  const months = Object.keys(parMois || {}).sort()
  const total = months.reduce((sum, m) => sum + parMois[m], 0)

  const data = {
    labels: months.map(formatMonth),
    datasets: [{
      data: months.map(m => parMois[m]),
      backgroundColor: '#e8000d',
      borderRadius: 2,
      borderSkipped: false,
    }],
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">Ventes par mois</div>
        <div className="chart-total">€ {total.toLocaleString('fr-FR')} au total</div>
      </div>
      <div className="chart-body">
        {months.length > 0
          ? <Bar data={data} options={OPTIONS} />
          : <div className="dashboard-empty"><p>Aucune vente confirmée pour l'instant.</p></div>
        }
      </div>
    </div>
  )
}
