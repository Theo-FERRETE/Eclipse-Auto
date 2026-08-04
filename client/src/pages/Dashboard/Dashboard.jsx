// Espace client : réservations et profil. Les réservations passent par l'API, qui filtre sur
// le JWT et renvoie les équipements liés.

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar'
import DashboardReservations from '@/components/DashboardReservations/DashboardReservations'
import DashboardProfile from '@/components/DashboardProfile/DashboardProfile'
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal'
import './Dashboard.css'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const [view, setView] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(new Set())
  const [cancelError, setCancelError] = useState(null)
  const [confirmCancelId, setConfirmCancelId] = useState(null)

  useEffect(() => {
    // Passe par l'API : le client_id est extrait du JWT côté serveur, et la réponse
    // inclut les équipements de la relation many-to-many (absents d'un select direct).
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
      setCancelError(null)
    } else {
      setCancelError('Impossible d\'annuler cette réservation. Veuillez réessayer.')
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

  return (
    <main className="dashboard">
      <div className="dashboard-hero">
        <div className="container">
          <div className="tag">Espace personnel</div>
          <h1 className="dashboard-title">
            Bonjour, <em>{profile?.first_name || 'Client'}</em>
          </h1>
        </div>
      </div>

      <div className="divider"></div>

      <div className="container dashboard-layout">
        <DashboardSidebar profile={profile} user={user} view={view} onViewChange={setView} />
        <div className="dashboard-main">
          {view === 'reservations' && (
            <>
              {cancelError && (
                <div className="form-error" role="alert" style={{ marginBottom: '16px' }}>{cancelError}</div>
              )}
              <DashboardReservations
                reservations={reservations}
                loading={loading}
                cancelling={cancelling}
                onCancel={requestCancel}
              />
            </>
          )}
          {view === 'profile' && (
            <DashboardProfile user={user} profile={profile} refreshProfile={refreshProfile} />
          )}
        </div>
      </div>

      {confirmCancelId && (
        <ConfirmModal
          message="Cette réservation est déjà confirmée. Voulez-vous vraiment l'annuler ?"
          onConfirm={confirmCancel}
          onCancel={() => setConfirmCancelId(null)}
        />
      )}
    </main>
  )
}
