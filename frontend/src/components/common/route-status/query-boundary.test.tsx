// @vitest-environment jsdom

import type * as Router from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QueryBoundary } from '#/components/common/route-status/query-boundary'
import { m } from '#/paraglide/messages'

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  useLocation: () => ({ pathname: '/administrator' }),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

let broken = true

function Child(): string {
  if (broken) throw new Error('boom')
  return 'carregou'
}

describe('QueryBoundary', () => {
  it('when the children render, they are shown without the fallback', () => {
    broken = false
    render(
      <QueryBoundary>
        <Child />
      </QueryBoundary>,
    )

    expect(screen.getByText('carregou')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('when a child throws, the fallback is announced with a retry button', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    broken = true
    render(
      <QueryBoundary>
        <Child />
      </QueryBoundary>,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(m.kit_error_title())).toBeTruthy()
    expect(screen.getByRole('button', { name: m.kit_retry() })).toBeTruthy()
  })

  it('when retry is pressed and the child recovers, the content comes back', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    broken = true
    render(
      <QueryBoundary>
        <Child />
      </QueryBoundary>,
    )

    broken = false
    fireEvent.click(screen.getByRole('button', { name: m.kit_retry() }))

    expect(screen.getByText('carregou')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
