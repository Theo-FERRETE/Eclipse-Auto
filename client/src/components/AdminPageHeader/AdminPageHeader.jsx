// Titre des pages d'administration.

export default function AdminPageHeader({ title }) {
  return (
    <>
      <div className="admin-hero">
        <div className="page-section">
          <div className="tag">Administration</div>
          <h1 className="admin-title">{title}</h1>
        </div>
      </div>
      <div className="divider"></div>
    </>
  )
}
