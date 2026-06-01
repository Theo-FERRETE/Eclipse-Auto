import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '@/components/Pagination/Pagination'

describe('Pagination — rendu', () => {
  it('ne rend rien si totalPages <= 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche toutes les pages si totalPages <= 7', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 5')).toBeInTheDocument()
  })

  it('marque la page active avec aria-current="page"', () => {
    render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Page 3')).toHaveAttribute('aria-current', 'page')
  })

  it('le bouton précédent est désactivé sur la page 1', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Page précédente')).toBeDisabled()
  })

  it('le bouton suivant est désactivé sur la dernière page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Page suivante')).toBeDisabled()
  })

  it('affiche des ellipses pour les grandes listes', () => {
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />)
    expect(screen.getAllByText('…').length).toBeGreaterThan(0)
  })
})

describe('Pagination — interactions', () => {
  it('appelle onPageChange avec page - 1 en cliquant précédent', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Page précédente'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('appelle onPageChange avec page + 1 en cliquant suivant', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Page suivante'))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('appelle onPageChange avec le numéro de page cliqué', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Page 4'))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })
})
