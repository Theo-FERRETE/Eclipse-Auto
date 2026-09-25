// Navigation de l'espace client, en pastilles à côté du titre.

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TABS = [
  { view: 'reservations', label: 'dashboard.tabReservations' },
  { view: 'ventes', label: 'dashboard.tabVentes' },
  { view: 'profile', label: 'dashboard.tabProfile' },
]

export default function DashboardTabs({ view, onViewChange }) {
  const { t } = useTranslation()

  return (
    <div className="dashboard-tabs">
      {TABS.map(tab => (
        <button
          key={tab.view}
          type="button"
          className={`tab-pill${view === tab.view ? ' active' : ''}`}
          onClick={() => onViewChange(tab.view)}
        >
          {t(tab.label)}
        </button>
      ))}
      <Link to="/catalogue" className="dashboard-tabs-catalogue">
        {t('dashboard.catalogueLink')}
      </Link>
    </div>
  )
}
