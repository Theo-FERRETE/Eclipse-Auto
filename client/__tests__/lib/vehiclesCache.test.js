import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase AVANT tout import — les variables inline évitent le problème de hoisting
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
}))

import { supabase } from '@/lib/supabase'
import { getVehicles, getVehicleBySlug, invalidateVehiclesCache } from '@/lib/vehiclesCache'

const mockVehicle = { id: '1', brand: 'Toyota', model: 'Corolla', status: 'available' }

beforeEach(() => {
  invalidateVehiclesCache()
  vi.clearAllMocks()
})

describe('getVehicles', () => {
  it('appelle Supabase si le cache est vide', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [mockVehicle], error: null }),
      })),
    })

    const { data } = await getVehicles()

    expect(supabase.from).toHaveBeenCalledWith('vehicles')
    expect(data).toEqual([mockVehicle])
  })

  it('retourne le cache sans appeler Supabase si le cache est chaud', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [mockVehicle], error: null }),
      })),
    })

    await getVehicles()
    vi.clearAllMocks()
    const { data } = await getVehicles()

    expect(supabase.from).not.toHaveBeenCalled()
    expect(data).toEqual([mockVehicle])
  })
})

describe('getVehicleBySlug — cache froid', () => {
  it('appelle /api/vehicles/by-slug/:slug si cache vide', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockVehicle,
    })

    const { data, error } = await getVehicleBySlug('toyota-corolla')

    expect(fetch).toHaveBeenCalledWith('/api/vehicles/by-slug/toyota-corolla')
    expect(data).toEqual(mockVehicle)
    expect(error).toBeNull()
  })

  it('retourne une erreur si la réponse n\'est pas ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })

    const { data, error } = await getVehicleBySlug('slug-inexistant')

    expect(data).toBeNull()
    expect(error).toHaveProperty('message')
  })
})

describe('getVehicleBySlug — cache chaud', () => {
  it('cherche dans le cache sans faire de fetch', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [mockVehicle], error: null }),
      })),
    })
    await getVehicles()

    globalThis.fetch = vi.fn()
    const { data } = await getVehicleBySlug('toyota-corolla')

    expect(fetch).not.toHaveBeenCalled()
    expect(data).toEqual(mockVehicle)
  })

  it('retourne null si le slug ne correspond à aucun véhicule', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [mockVehicle], error: null }),
      })),
    })
    await getVehicles()

    globalThis.fetch = vi.fn()
    const { data, error } = await getVehicleBySlug('renault-clio')

    expect(data).toBeNull()
    expect(error).toHaveProperty('message')
  })
})
