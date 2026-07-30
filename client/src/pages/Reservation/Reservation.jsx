import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { getVehicleBySlug } from '@/lib/vehiclesCache'
import ReservationBreadcrumb from '@/components/ReservationBreadcrumb/ReservationBreadcrumb'
import ReservationVehiclePanel from '@/components/ReservationVehiclePanel/ReservationVehiclePanel'
import ReservationForm from '@/components/ReservationForm/ReservationForm'
import ReservationSuccess from '@/components/ReservationSuccess/ReservationSuccess'
import './Reservation.css'

export default function Reservation() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ message: '', rdv_date: '' })
  const [equipements, setEquipements] = useState([])
  const [selectedEquipementIds, setSelectedEquipementIds] = useState(
    (location.state?.selectedEquipements || []).map(eq => eq.id)
  )

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      // Réutilise le cache partagé plutôt que de recharger tout le catalogue
      const { data: found, error } = await getVehicleBySlug(slug)
      if (error || !found || found.status !== 'available') { navigate('/catalogue'); return }

      setVehicle(found)
      setLoading(false)

      const res = await fetch('/api/equipements')
      if (res.ok) {
        setEquipements(await res.json())
      }
    }
    init()
  }, [slug, navigate])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function toggleEquipement(id) {
    setSelectedEquipementIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          message: form.message || null,
          rdv_date: form.rdv_date || null,
          equipement_ids: selectedEquipementIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Une erreur est survenue.')
      }

      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 3000)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="reservation-loading">
        <div className="loader"></div>
      </main>
    )
  }

  if (success) return <ReservationSuccess vehicle={vehicle} />

  return (
    <main className="reservation">
      <ReservationBreadcrumb slug={slug} brand={vehicle.brand} model={vehicle.model} />
      <div className="container reservation-layout">
        <ReservationVehiclePanel vehicle={vehicle} />
        <ReservationForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          error={error}
          submitting={submitting}
          profile={profile}
          user={user}
          equipements={equipements}
          selectedEquipementIds={selectedEquipementIds}
          onToggleEquipement={toggleEquipement}
          slug={slug}
        />
      </div>
    </main>
  )
}
