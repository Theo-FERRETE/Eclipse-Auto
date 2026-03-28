import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    vehicles: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    reservations: 0,
    pending: 0,
    confirmed: 0,
    clients: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: vehicles },
        { count: available },
        { count: reserved },
        { count: sold },
        { count: reservations },
        { count: pending },
        { count: confirmed },
        { count: clients },
      ] = await Promise.all([
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'reserved'),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('reservations').select('*', { count: 'exact', head: true }),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      ])

      setStats({ vehicles, available, reserved, sold, reservations, pending, confirmed, clients })
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <main className="admin">
      <div className="admin-hero">
        <div className="container">
          <div className="tag">Administration</div>
          <h1 className="admin-title">Dashboard</h1>
        </div>
      </div>

      <div className="divider"></div>

      <div className="container admin-layout">
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <Link to="/admin" className="sidebar-link active">
              Dashboard
            </Link>
            <Link to="/admin/vehicles" className="sidebar-link">
              Véhicules
            </Link>
            <Link to="/admin/reservations" className="sidebar-link">
              Réservations
            </Link>
            <Link to="/dashboard" className="sidebar-link">
              Espace client
            </Link>
          </nav>
        </aside>

        <div className="admin-main">
          {loading ? (
            <div className="dashboard-loading"><div className="loader"></div></div>
          ) : (
            <>
              <div className="admin-section-title">
                <div className="tag">Véhicules</div>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-n">{stats.vehicles}</div>
                  <div className="stat-card-l">Total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-n available">{stats.available}</div>
                  <div className="stat-card-l">Disponibles</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-n reserved">{stats.reserved}</div>
                  <div className="stat-card-l">Réservés</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-n sold">{stats.sold}</div>
                  <div className="stat-card-l">Vendus</div>
                </div>
              </div>

              <div className="admin-section-title" style={{ marginTop: '40px' }}>
                <div className="tag">Réservations</div>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-n">{stats.reservations}</div>
                  <div className="stat-card-l">Total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-n pending">{stats.pending}</div>
                  <div className="stat-card-l">En attente</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-n confirmed">{stats.confirmed}</div>
                  <div className="stat-card-l">Confirmées</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-n">{stats.clients}</div>
                  <div className="stat-card-l">Clients</div>
                </div>
              </div>

              <div className="admin-actions">
                <Link to="/admin/vehicles" className="btn-primary">
                  Gérer les véhicules
                </Link>
                <Link to="/admin/reservations" className="btn-ghost">
                  Gérer les réservations
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}