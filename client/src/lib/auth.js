// Connexion, inscription, session. Le mot de passe part direct chez Supabase, l'app ne le
// voit jamais. Ces fonctions lèvent l'erreur, les pages les entourent d'un try/catch.

import { supabase } from './supabase'

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

// options.data remplit user_metadata : de là viennent le prénom et le nom qu'on retrouve
// dans profiles. Attention, l'utilisateur peut le modifier lui-même — acceptable pour un
// prénom, ce serait une faille pour un rôle, d'où le rôle rangé dans app_metadata.
export async function register(email, password, firstName, lastName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  })
  if (error) throw error
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}