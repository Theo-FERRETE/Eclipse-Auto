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
  const cancelled = (r.total ?? 0) - (r.pending ?? 0) - (r.confirmed ?? 0)

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
                  <div className="kpi-n">{v.total}</div>
                  <div className="kpi-l">Véhicules</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-n">{r.total}</div>
                  <div className="kpi-l">Réservations</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-n confirmed">{r.confirmed}</div>
                  <div className="kpi-l">Confirmées</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-n">{stats.clients}</div>
                  <div className="kpi-l">Clients</div>
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
                  cancelled={Math.max(0, cancelled)}
                />
              </div>

              <div className="admin-actions">
                <Link to="/admin/vehicles" className="btn-primary">Gérer les véhicules</Link>
                <Link to="/admin/reservations" className="btn-ghost">Gérer les réservations</Link>
                <Link to="/admin/users" className="btn-ghost">Gérer les clients</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
