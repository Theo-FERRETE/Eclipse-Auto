// Pagination réutilisable, avec des « ... » au-delà de 7 pages.

import './Pagination.css'

// Construit la liste à afficher, par exemple [1, '...', 7, 8, 9, '...', 42] : toujours la
// première page, la page courante et ses voisines, la dernière.
function getPages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages = []
  pages.push(1)

  // « ... » seulement s'il y a vraiment un trou entre 1 et start.
  if (page > 3) pages.push('...')

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (page < totalPages - 2) pages.push('...')

  pages.push(totalPages)
  return pages
}

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = getPages(page, totalPages)

  return (
    <div className="pagination">
      <button
        className="page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Page précédente"
      >
        ←
      </button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
          : (
            <button
              key={p}
              className={`page-btn${p === page ? ' active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
      )}
      <button
        className="page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Page suivante"
      >
        →
      </button>
    </div>
  )
}
