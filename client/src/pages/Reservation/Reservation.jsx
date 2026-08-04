// Formulaire de réservation. Poste vers l'API avec le JWT ; le client_id vient du token.

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
  // Les équipements cochés sur la fiche véhicule arrivent par location.state. C'est perdu
  // au rechargement, mais ça évite une URL illisible.
  const [selectedEquipementIds, setSelectedEquipementIds] = useState(
    (location.state?.selectedEquipements || []).map(eq => eq.id)
  )

  useEffect(() => {
    async function init() {
      // ProtectedRoute vérifie à l'entrée, ici on revérifie que la session est toujours valide.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      // Inexistant, en erreur ou déjà réservé : dans tous les cas il n'y a rien à réserver.
      // Le serveur revérifie de toute façon, ce test évite juste un formulaire inutile.
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

  // Toujours un nouveau tableau, jamais un push() : React compare les références.
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
          // Pas de client_id : le serveur l'extrait du JWT.
          vehicle_id: vehicle.id,
          message: form.message || null,
          rdv_date: form.rdv_date || null,
          equipement_ids: selectedEquipementIds,
        }),
      })

      // fetch ne lève pas d'exception sur un 4xx : sans ce test, une réservation refusée
      // passerait pour un succès.
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Une erreur est survenue.')
      }

      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 3000)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      // finally : le bouton doit être réactivé même en cas d'erreur.
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
