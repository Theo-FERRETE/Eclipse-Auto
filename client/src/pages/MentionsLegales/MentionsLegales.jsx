// Mentions légales (page statique).

import { useTranslation, Trans } from 'react-i18next'
import './MentionsLegales.css'

export default function MentionsLegales() {
  const { t } = useTranslation()

  return (
    <main className="mentions">
      <div className="mentions-hero">
        <div className="page-section">
          <div className="tag">{t('legal.tag')}</div>
          <h1 className="mentions-title">{t('legal.title')}</h1>
        </div>
      </div>

      <div className="divider"></div>

      <div className="page-section mentions-content">

        {/* Trans pour les paragraphes : le gras se déplace d'une langue à l'autre, il
            doit donc rester dans la traduction et pas dans le JSX. */}
        <div className="mentions-block">
          <h2 className="mentions-section">{t('legal.s1Title')}</h2>
          <p><Trans i18nKey="legal.s1Body" components={{ b: <strong /> }} /></p>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">{t('legal.s2Title')}</h2>
          <div className="mentions-table">
            <div className="mentions-row">
              <span className="mentions-key">{t('legal.s2Name')}</span>
              <span className="mentions-val">{t('legal.s2NameValue')}</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">{t('legal.s2Status')}</span>
              <span className="mentions-val">{t('legal.s2StatusValue')}</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">{t('legal.s2Email')}</span>
              <span className="mentions-val">theo.ferrete@gmail.com</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">{t('legal.s2Portfolio')}</span>
              <span className="mentions-val">theo-ferrete.fr</span>
            </div>
          </div>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">{t('legal.s3Title')}</h2>
          <div className="mentions-table">
            <div className="mentions-row">
              <span className="mentions-key">{t('legal.s3Host')}</span>
              <span className="mentions-val">{t('legal.s3HostValue')}</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">{t('legal.s3Server')}</span>
              <span className="mentions-val">Nginx</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">{t('legal.s3Database')}</span>
              <span className="mentions-val">Supabase (PostgreSQL)</span>
            </div>
          </div>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">{t('legal.s4Title')}</h2>
          <p><Trans i18nKey="legal.s4Body" components={{ b: <strong /> }} /></p>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">{t('legal.s5Title')}</h2>
          <p><Trans i18nKey="legal.s5Body" components={{ b: <strong /> }} /></p>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">{t('legal.s6Title')}</h2>
          <p>{t('legal.s6Body')}</p>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">{t('legal.s7Title')}</h2>
          <p><Trans i18nKey="legal.s7Body" components={{ b: <strong /> }} /></p>
        </div>

      </div>
    </main>
  )
}
