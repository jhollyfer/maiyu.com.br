// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LoadError } from '#/components/common/route-status/load-error'
import { m } from '#/paraglide/messages'

describe('LoadError', () => {
  it('when not retrying, the button is enabled and calls refetch', () => {
    const refetch = vi.fn()
    render(<LoadError refetch={refetch} />)

    const button = screen.getByTestId('retry-btn')
    fireEvent.click(button)

    expect(button.hasAttribute('disabled')).toBe(false)
    expect(screen.queryByRole('status')).toBeNull()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('while retrying, the button is disabled and shows the spinner', () => {
    const refetch = vi.fn()
    render(<LoadError refetch={refetch} retrying />)

    const button = screen.getByTestId('retry-btn')
    fireEvent.click(button)

    expect(button.hasAttribute('disabled')).toBe(true)
    expect(
      within(button).getByRole('status', { name: m.kit_loading() }),
    ).toBeTruthy()
    expect(refetch).not.toHaveBeenCalled()
  })
})
