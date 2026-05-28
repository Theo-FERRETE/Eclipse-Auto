import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar'
import DashboardReservations from '@/components/DashboardReservations/DashboardReservations'
import DashboardProfile from '@/components/DashboardProfile/DashboardProfile'
import './Dashboard.css'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const [view, setView] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(new Set())

  useEffect(() => {
    async function fetchReservations() {
      if (!user) return
      const { data, error } = await supabase
        .from('reservations')
        .select('*, vehicles(brand, model, images, price)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) setReservations(data || [])
      setLoading(false)
    }
    fetchReservations()
  }, [user])

  async function handleCancel(id) {
    if (cancelling.has(id)) return
    setCancelling(prev => new Set(prev).add(id))

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/reservations/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
    })

    if (res.ok) {
      setReservations(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r)
      )
    }

    setCancelling(prev => { const s = new Set(prev); s.delete(id); return s })
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
            <DashboardReservations
              reservations={reservations}
              loading={loading}
              cancelling={cancelling}
              onCancel={handleCancel}
            />
          )}
          {view === 'profile' && (
            <DashboardProfile user={user} profile={profile} refreshProfile={refreshProfile} />
          )}
        </div>
      </div>
    </main>
  )
}
