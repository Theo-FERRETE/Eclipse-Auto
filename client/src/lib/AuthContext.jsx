// Session partagée à toute l'app via useAuth().
// `loading` évite de rediriger vers /login un utilisateur connecté pendant le chargement.

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }

  useEffect(() => {
    // « Suis-je déjà connecté ? » — la session est relue du localStorage, c'est ce qui fait
    // qu'un F5 ne déconnecte pas.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // « Quelque chose change-t-il ? » — sans cet abonnement, se connecter n'aurait aucun
    // effet visible avant un rechargement manuel.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      // Rôle lu dans profiles : sert seulement à l'affichage. Le serveur, lui, vérifie
      // app_metadata.role, qui est dans le JWT signé.
      isAdmin: profile?.role === 'admin',
      isClient: profile?.role === 'client',
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
