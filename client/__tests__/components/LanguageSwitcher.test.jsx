import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import i18n from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher'
import NotFound from '@/pages/NotFound/NotFound'

// La langue vit dans un singleton i18next partagé : sans ce retour au français, un test
// qui bascule en anglais contaminerait les suivants du même fichier.
afterEach(async () => {
  await i18n.changeLanguage('fr')
})

describe('LanguageSwitcher', () => {
  it('marque la langue courante et propose l\'autre', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: /français/i })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /english/i })).not.toHaveAttribute('aria-current')
  })

  it('bascule la langue de i18next au clic', async () => {
    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole('button', { name: /english/i }))

    expect(i18n.resolvedLanguage).toBe('en')
  })

  it('met à jour l\'attribut lang du document', async () => {
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')

    await i18n.changeLanguage('fr')
    expect(document.documentElement.lang).toBe('fr')
  })
})

describe('traduction des pages', () => {
  it('rend une page publique dans la langue courante', async () => {
    const { rerender } = render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /page introuvable/i })).toBeInTheDocument()

    await i18n.changeLanguage('en')
    rerender(<MemoryRouter><NotFound /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })
})
