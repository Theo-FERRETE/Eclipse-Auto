// Espace client : essais, achats et profil. Les deux premiers passent par l'API, qui filtre
// sur le JWT.

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardTabs from '@/components/DashboardTabs/DashboardTabs'
import DashboardReservations from '@/components/DashboardReservations/DashboardReservations'
import DashboardVentes from '@/components/DashboardVentes/DashboardVentes'
import DashboardProfile from '@/components/DashboardProfile/DashboardProfile'
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import './Dashboard.css'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useTranslation()
  const [view, setView] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [ventesLoading, setVentesLoading] = useState(true)
  const [cancelling, setCancelling] = useState(new Set())
  const [cancelError, setCancelError] = useState(false)
  const [confirmCancelId, setConfirmCancelId] = useState(null)
  const [ventesCancelling, setVentesCancelling] = useState(new Set())
  const [ventesCancelError, setVentesCancelError] = useState(false)

  useEffect(() => {
    // Passe par l'API : le client_id est extrait du JWT côté serveur.
    async function fetchReservations() {
      if (!user) return
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/reservations', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      if (res.ok) setReservations(await res.json())
      setLoading(false)
    }
    fetchReservations()
  }, [user])

  useEffect(() => {
    async function fetchVentes() {
      if (!user) return
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/ventes', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      if (res.ok) setVentes(await res.json())
      setVentesLoading(false)
    }
    fetchVentes()
  }, [user])

  async function handleCancel(id) {
    // Anti-double-clic. Un Set plutôt qu'un booléen, pour ne bloquer que cette ligne-là.
    if (cancelling.has(id)) return
    // Nouveau Set : muter l'existant ne changerait pas la référence, React ne redessinerait rien.
    setCancelling(prev => new Set(prev).add(id))

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/reservations/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
    })

    if (res.ok) {
      // Mise à jour locale plutôt qu'un rechargement : on connaît déjà le résultat.
      setReservations(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r)
      )
      setCancelError(false)
    } else {
      // Un booléen, pas un message : le texte est traduit au rendu.
      setCancelError(true)
    }

    setCancelling(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  // Une demande en attente s'annule directement ; une réservation déjà confirmée demande
  // une confirmation.
  function requestCancel(id, status) {
    if (status === 'confirmed') {
      setConfirmCancelId(id)
    } else {
      handleCancel(id)
    }
  }

  function confirmCancel() {
    handleCancel(confirmCancelId)
    setConfirmCancelId(null)
  }

  // Pas de double confirmation ici : le bouton n'est proposé que sur un achat 'pending'
  // (voir DashboardVentes), donc jamais sur un achat déjà confirmé.
  async function handleCancelVente(id) {
    if (ventesCancelling.has(id)) return
    setVentesCancelling(prev => new Set(prev).add(id))

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/ventes/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
    })

    if (res.ok) {
      setVentes(prev => prev.map(v => v.id === id ? { ...v, status: 'cancelled' } : v))
      setVentesCancelError(false)
    } else {
      setVentesCancelError(true)
    }

    setVentesCancelling(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  return (
    <main className="dashboard">
      <div className="dashboard-hero">
        <div className="page-section">
          <div className="tag">{profile?.first_name || t('dashboard.defaultName')} {profile?.last_name}</div>
          <h1 className="dashboard-title">{t('dashboard.title')}</h1>
          <DashboardTabs view={view} onViewChange={setView} />
        </div>
      </div>

      <div className="divider"></div>

      <div className="page-section dashboard-main">
        {view === 'reservations' && (
          <>
            {cancelError && (
              <div className="form-error" role="alert" style={{ marginBottom: '16px' }}>{t('dashboard.cancelReservationError')}</div>
            )}
            <DashboardReservations
              reservations={reservations}
              loading={loading}
              cancelling={cancelling}
              onCancel={requestCancel}
            />
          </>
        )}
        {view === 'ventes' && (
          <>
            {ventesCancelError && (
              <div className="form-error" role="alert" style={{ marginBottom: '16px' }}>{t('dashboard.cancelVenteError')}</div>
            )}
            <DashboardVentes
              ventes={ventes}
              loading={ventesLoading}
              cancelling={ventesCancelling}
              onCancel={handleCancelVente}
            />
          </>
        )}
        {view === 'profile' && (
          <DashboardProfile user={user} profile={profile} refreshProfile={refreshProfile} />
        )}
      </div>

      {confirmCancelId && (
        <ConfirmModal
          message={t('dashboard.confirmCancelReservation')}
          onConfirm={confirmCancel}
          onCancel={() => setConfirmCancelId(null)}
        />
      )}
    </main>
  )
}
