// Bloque les routes privées. Affichage seulement : le serveur revérifie à chaque appel.

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading } = useAuth()

  // Session pas encore résolue : ne rien décider. Sans ça, un utilisateur connecté serait
  // redirigé vers /login à chaque rechargement.
  if (loading) return null

  // replace, sinon le bouton Précédent ramène ici et reboucle sur /login.
  if (!user) return <Navigate to="/login" replace />

  // Vers son espace et pas vers /login : il est déjà connecté.
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}