import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardProfile({ user, profile, refreshProfile }) {
  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone,
      })
      .eq('id', user.id)

    if (error) {
      setProfileMsg({ type: 'error', text: 'Erreur lors de la sauvegarde.' })
    } else {
      await refreshProfile()
      setProfileMsg({ type: 'success', text: 'Profil mis à jour.' })
    }
    setProfileSaving(false)
  }

  async function handlePasswordSave(e) {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (pwForm.password.length < 6) {
      setPwMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 6 caractères.' })
      return
    }
    setPwSaving(true)
    setPwMsg(null)

    const { error } = await supabase.auth.updateUser({ password: pwForm.password })

    if (error) {
      setPwMsg({ type: 'error', text: error.message })
    } else {
      setPwMsg({ type: 'success', text: 'Mot de passe mis à jour.' })
      setPwForm({ password: '', confirm: '' })
    }
    setPwSaving(false)
  }

  return (
    <>
      <div className="dashboard-section-title">
        <div className="tag">Paramètres</div>
        <h2 className="section-title" style={{ fontSize: '32px', marginTop: '8px' }}>
          Mon profil
        </h2>
      </div>

      <form className="profile-form" onSubmit={handleProfileSave}>
        <div className="profile-form-title">Informations personnelles</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="profile-firstname">Prénom</label>
            <input
              id="profile-firstname"
              className="form-input"
              value={profileForm.first_name}
              onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
              placeholder="Prénom"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-lastname">Nom</label>
            <input
              id="profile-lastname"
              className="form-input"
              value={profileForm.last_name}
              onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
              placeholder="Nom"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-phone">Téléphone</label>
          <input
            id="profile-phone"
            className="form-input"
            value={profileForm.phone}
            onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+33 6 00 00 00 00"
            type="tel"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            className="form-input"
            value={user?.email || ''}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          />
        </div>
        {profileMsg && (
          <div className={profileMsg.type === 'error' ? 'form-error' : 'form-success'} role={profileMsg.type === 'error' ? 'alert' : 'status'}>
            {profileMsg.text}
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={profileSaving}>
          {profileSaving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </form>

      <form className="profile-form" onSubmit={handlePasswordSave}>
        <div className="profile-form-title">Changer le mot de passe</div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-new-password">Nouveau mot de passe</label>
          <input
            id="profile-new-password"
            className="form-input"
            type="password"
            value={pwForm.password}
            onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
            placeholder="6 caractères minimum"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-confirm-password">Confirmer le mot de passe</label>
          <input
            id="profile-confirm-password"
            className="form-input"
            type="password"
            value={pwForm.confirm}
            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
            placeholder="Répéter le mot de passe"
          />
        </div>
        {pwMsg && (
          <div className={pwMsg.type === 'error' ? 'form-error' : 'form-success'} role={pwMsg.type === 'error' ? 'alert' : 'status'}>
            {pwMsg.text}
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={pwSaving}>
          {pwSaving ? 'Mise à jour...' : 'Changer le mot de passe'}
        </button>
      </form>
    </>
  )
}
