export default function AdminPageHeader({ title }) {
  return (
    <>
      <div className="admin-hero">
        <div className="container">
          <div className="tag">Administration</div>
          <h1 className="admin-title">{title}</h1>
        </div>
      </div>
      <div className="divider"></div>
    </>
  )
}
