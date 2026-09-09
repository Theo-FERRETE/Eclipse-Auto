// Formulaire d'achat (options + mode de paiement). Poste vers l'API avec le JWT ; le
// client_id vient du token, le prix final est recalculé côté serveur.

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { getVehicleBySlug } from '@/lib/vehiclesCache'
import ReservationBreadcrumb from '@/components/ReservationBreadcrumb/ReservationBreadcrumb'
import AchatVehiclePanel from '@/components/AchatVehiclePanel/AchatVehiclePanel'
import AchatForm from '@/components/AchatForm/AchatForm'
import AchatSuccess from '@/components/AchatSuccess/AchatSuccess'
// Classes partagées avec le parcours essai (mise en page identique, gabarit du form, etc.).
import '@/pages/Reservation/Reservation.css'

export default function Achat() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [equipements, setEquipements] = useState([])
  const [selectedEquipementIds, setSelectedEquipementIds] = useState([])
  const [modePaiement, setModePaiement] = useState('')
  // Posé par le bouton "Concrétiser la vente" depuis un essai terminé (Dashboard/Admin).
  const reservationId = location.state?.reservation_id || null

  useEffect(() => {
    async function init() {
      // ProtectedRoute vérifie à l'entrée, ici on revérifie que la session est toujours valide.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      // Un véhicule déjà vendu ne peut plus être acheté. 'reserved' (essai en cours) n'empêche
      // pas l'achat, comme côté serveur (venteController.create).
      const { data: found, error } = await getVehicleBySlug(slug)
      if (error || !found || found.status === 'sold') { navigate('/catalogue'); return }

      setVehicle(found)
      setLoading(false)

      const res = await fetch('/api/equipements')
      if (res.ok) {
        setEquipements(await res.json())
      }
    }
    init()
  }, [slug, navigate])

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
      const res = await fetch('/api/ventes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          // Pas de client_id ni de prix : le serveur les impose (JWT, prix recalculé).
          vehicle_id: vehicle.id,
          equipement_ids: selectedEquipementIds,
          mode_paiement: modePaiement,
          reservation_id: reservationId,
        }),
      })

      // fetch ne lève pas d'exception sur un 4xx : sans ce test, un achat refusé
      // (véhicule déjà vendu, mode de paiement invalide...) passerait pour un succès.
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

  if (success) return <AchatSuccess vehicle={vehicle} />

  const selectedEquipements = equipements.filter(eq => selectedEquipementIds.includes(eq.id))

  return (
    <main className="reservation">
      <ReservationBreadcrumb slug={slug} brand={vehicle.brand} model={vehicle.model} label="Achat" />
      <div className="container reservation-layout">
        <AchatVehiclePanel vehicle={vehicle} selectedEquipements={selectedEquipements} />
        <AchatForm
          modePaiement={modePaiement}
          onModePaiementChange={e => setModePaiement(e.target.value)}
          onSubmit={handleSubmit}
          error={error}
          submitting={submitting}
          profile={profile}
          user={user}
          equipements={equipements}
          selectedEquipementIds={selectedEquipementIds}
          onToggleEquipement={toggleEquipement}
          slug={slug}
          fromReservation={!!reservationId}
        />
      </div>
    </main>
  )
}
