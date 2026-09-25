// Page 404.

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './NotFound.css'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <main className="notfound">
      <div className="notfound-inner">
        <div className="notfound-code">404</div>
        <div className="tag">{t('notFound.tag')}</div>
        <h1 className="notfound-title">{t('notFound.title')}</h1>
        <p className="notfound-sub">
          {t('notFound.sub')}
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">{t('notFound.home')}</Link>
          <Link to="/catalogue" className="btn-ghost">{t('notFound.catalogue')}</Link>
        </div>
      </div>
    </main>
  )
}
