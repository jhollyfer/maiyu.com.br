import type { QueryClient } from '@tanstack/react-query'
import { isNotFound } from '@tanstack/react-router'
import { fromPartial } from '@total-typescript/shoehorn'
import { describe, expect, it, vi } from 'vitest'

import type { CityResponse } from '@maiyu/shared'

import { CityGuard } from './city-guard'

const city = fromPartial<CityResponse>({ slug: 'benjamin-constant' })

function contextOf(query: () => Promise<CityResponse | null>) {
  return { queryClient: fromPartial<QueryClient>({ query }) }
}

/** Captures the rejection as `unknown`, without a typed `.catch((e) => e)`. */
async function rejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }

  throw new Error('esperava rejeição, a promessa resolveu')
}

describe('CityGuard.require', () => {
  it('returns the city of the slug', async () => {
    const context = contextOf(async () => city)

    await expect(
      CityGuard.require({ context, slug: 'benjamin-constant' }),
    ).resolves.toEqual({ city })
  })

  it('throws notFound when no city has the slug', async () => {
    const context = contextOf(async () => null)

    const error = await rejection(CityGuard.require({ context, slug: 'x' }))

    expect(isNotFound(error)).toBe(true)
  })

  it('throws notFound for a segment with a dot, a file and not a city, without asking the API', async () => {
    const query = vi.fn().mockResolvedValue(city)

    const error = await rejection(
      CityGuard.require({ context: contextOf(query), slug: 'cv.pdf' }),
    )

    expect(isNotFound(error)).toBe(true)
    expect(query).not.toHaveBeenCalled()
  })

  it('lets a network or server failure through: an API down is not a missing city', async () => {
    const failure = new Error('rede')
    const context = contextOf(vi.fn().mockRejectedValue(failure))

    const error = await rejection(CityGuard.require({ context, slug: 'x' }))

    expect(error).toBe(failure)
  })
})
