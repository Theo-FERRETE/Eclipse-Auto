// Profil et mot de passe. Seule écriture qui passe encore en direct par Supabase.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

export default function DashboardProfile({ user, profile, refreshProfile }) {
  const { t } = useTranslation()
  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  // Les messages sont stockés sous forme de clé, jamais de texte : un changement de
  // langue doit aussi retraduire un message déjà affiché.
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
      setProfileMsg({ type: 'error', key: 'dashboard.saveError' })
    } else {
      await refreshProfile()
      setProfileMsg({ type: 'success', key: 'dashboard.saveSuccess' })
    }
    setProfileSaving(false)
  }

  async function handlePasswordSave(e) {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) {
      setPwMsg({ type: 'error', key: 'common.passwordMismatch' })
      return
    }
    if (pwForm.password.length < 6) {
      setPwMsg({ type: 'error', key: 'common.passwordTooShort' })
      return
    }
    setPwSaving(true)
    setPwMsg(null)

    const { error } = await supabase.auth.updateUser({ password: pwForm.password })

    if (error) {
      // Message brut de Supabase : pas de clé, on affiche tel quel.
      setPwMsg({ type: 'error', text: error.message })
    } else {
      setPwMsg({ type: 'success', key: 'dashboard.passwordUpdated' })
      setPwForm({ password: '', confirm: '' })
    }
    setPwSaving(false)
  }

  function renderMsg(msg) {
    if (!msg) return null
    return (
      <div
        className={msg.type === 'error' ? 'form-error' : 'form-success'}
        role={msg.type === 'error' ? 'alert' : 'status'}
      >
        {msg.key ? t(msg.key) : msg.text}
      </div>
    )
  }

  return (
    <>
      <div className="dashboard-section-title">
        <div className="tag">{t('dashboard.settingsTag')}</div>
        <h2 className="section-title" style={{ fontSize: '32px', marginTop: '8px' }}>
          {t('dashboard.tabProfile')}
        </h2>
      </div>

      <div className="profile-forms-row">
        <form className="profile-form" onSubmit={handleProfileSave}>
          <div className="profile-form-title">{t('dashboard.personalInfo')}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="profile-firstname">{t('common.firstName')}</label>
              <input
                id="profile-firstname"
                className="form-input"
                value={profileForm.first_name}
                onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                placeholder={t('common.firstName')}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-lastname">{t('common.lastName')}</label>
              <input
                id="profile-lastname"
                className="form-input"
                value={profileForm.last_name}
                onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                placeholder={t('common.lastName')}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-phone">{t('common.phone')}</label>
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
            <label className="form-label" htmlFor="profile-email">{t('common.email')}</label>
            <input
              id="profile-email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>
          {renderMsg(profileMsg)}
          <button type="submit" className="btn-primary" disabled={profileSaving}>
            {profileSaving ? t('dashboard.saving') : t('dashboard.save')}
          </button>
        </form>

        <form className="profile-form" onSubmit={handlePasswordSave}>
          <div className="profile-form-title">{t('dashboard.changePassword')}</div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-new-password">{t('auth.resetNewPassword')}</label>
            <input
              id="profile-new-password"
              className="form-input"
              type="password"
              value={pwForm.password}
              onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
              placeholder={t('dashboard.passwordPlaceholder')}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-confirm-password">{t('common.passwordConfirm')}</label>
            <input
              id="profile-confirm-password"
              className="form-input"
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder={t('dashboard.passwordRepeatPlaceholder')}
            />
          </div>
          {renderMsg(pwMsg)}
          <button type="submit" className="btn-primary" disabled={pwSaving}>
            {pwSaving ? t('dashboard.passwordUpdating') : t('dashboard.changePassword')}
          </button>
        </form>
      </div>
    </>
  )
}
