// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RoutePending } from '#/components/common/route-status/route-pending'
import { m } from '#/paraglide/messages'

describe('RoutePending', () => {
  it('announces the wait in the locale, not "Loading"', () => {
    render(<RoutePending />)

    expect(screen.getByRole('status', { name: m.kit_loading() })).toBeTruthy()
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull()
  })
})
