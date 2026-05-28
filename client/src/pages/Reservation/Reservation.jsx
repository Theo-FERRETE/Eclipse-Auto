import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { toSlug } from '@/lib/utils'
import ReservationBreadcrumb from '@/components/ReservationBreadcrumb/ReservationBreadcrumb'
import ReservationVehiclePanel from '@/components/ReservationVehiclePanel/ReservationVehiclePanel'
import ReservationForm from '@/components/ReservationForm/ReservationForm'
import ReservationSuccess from '@/components/ReservationSuccess/ReservationSuccess'
import './Reservation.css'

export default function Reservation() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ message: '', rdv_date: '' })

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const { data, error } = await supabase.from('vehicles').select('*')
      if (error || !data) { navigate('/catalogue'); return }

      const found = data.find(v => toSlug(v.brand, v.model) === slug)
      if (!found || found.status !== 'available') { navigate('/catalogue'); return }

      setVehicle(found)
      setLoading(false)
    }
    init()
  }, [slug, navigate])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
          slug={slug}
        />
      </div>
    </main>
  )
}
