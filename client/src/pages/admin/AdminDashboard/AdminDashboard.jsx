import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar'
import AdminPageHeader from '@/components/AdminPageHeader/AdminPageHeader'
import VehicleStatusChart from '@/components/AdminCharts/VehicleStatusChart'
import ReservationStatusChart from '@/components/AdminCharts/ReservationStatusChart'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      if (res.ok) setStats(await res.json())
      setLoading(false)
    }
    fetchStats()
  }, [])

  const v = stats?.vehicles ?? {}
  const r = stats?.reservations ?? {}
  const cancelled = Math.max(0, (r.total ?? 0) - (r.pending ?? 0) - (r.confirmed ?? 0))

  return (
    <main className="admin">
      <AdminPageHeader title="Dashboard" />
      <div className="container admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          {loading ? (
            <div className="dashboard-loading"><div className="loader"></div></div>
          ) : (
            <>
              <div className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
                  </div>
                  <div className="kpi-n">{v.total ?? 0}</div>
                  <div className="kpi-l">Véhicules</div>
                  <div className="kpi-sub">{v.available ?? 0} disponibles · {v.reserved ?? 0} réservés</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div className="kpi-n">{r.total ?? 0}</div>
                  <div className="kpi-l">Réservations</div>
                  <div className="kpi-sub">{r.pending ?? 0} en attente · {cancelled} annulées</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon kpi-icon--green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div className="kpi-n confirmed">{r.confirmed ?? 0}</div>
                  <div className="kpi-l">Confirmées</div>
                  <div className="kpi-sub">
                    {r.total ? Math.round((r.confirmed / r.total) * 100) : 0}% du total
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="kpi-n">{stats.clients ?? 0}</div>
                  <div className="kpi-l">Clients</div>
                  <div className="kpi-sub">comptes enregistrés</div>
                </div>
              </div>

              <div className="charts-grid">
                <VehicleStatusChart
                  available={v.available ?? 0}
                  reserved={v.reserved ?? 0}
                  sold={v.sold ?? 0}
                />
                <ReservationStatusChart
                  pending={r.pending ?? 0}
                  confirmed={r.confirmed ?? 0}
                  cancelled={cancelled}
                />
              </div>

              <div className="quick-access">
                <Link to="/admin/vehicles" className="quick-card">
                  <div className="quick-card-header">
                    <span className="quick-card-title">Véhicules</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  <div className="quick-card-body">Gérer le catalogue</div>
                  <div className="quick-card-meta">{v.total ?? 0} véhicules · {v.available ?? 0} disponibles</div>
                </Link>
                <Link to="/admin/reservations" className="quick-card">
                  <div className="quick-card-header">
                    <span className="quick-card-title">Réservations</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  <div className="quick-card-body">Suivre les demandes</div>
                  <div className="quick-card-meta quick-card-meta--alert">
                    {r.pending ?? 0} en attente de confirmation
                  </div>
                </Link>
                <Link to="/admin/users" className="quick-card">
                  <div className="quick-card-header">
                    <span className="quick-card-title">Clients</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  <div className="quick-card-body">Gérer les comptes</div>
                  <div className="quick-card-meta">{stats.clients ?? 0} clients enregistrés</div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
