// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, it, vi } from 'vitest'

import { DisabledReason } from '#/components/common/disabled-reason/disabled-reason'
import { Button } from '#/components/ui/button'
import { TooltipProvider } from '#/components/ui/tooltip'

type ScreenProps = Readonly<{ reason?: string | false; onClick?: () => void }>

function Screen({ reason, onClick }: ScreenProps) {
  return (
    <TooltipProvider>
      <DisabledReason reason={reason}>
        <Button onClick={onClick}>Publicar</Button>
      </DisabledReason>
    </TooltipProvider>
  )
}

const REASON = 'Falta a capa.'

describe('DisabledReason', () => {
  it('describes the button itself by the reason, with no role in between', () => {
    render(<Screen reason={REASON} />)

    const button = screen.getByRole('button', {
      name: 'Publicar',
      description: REASON,
    })

    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('keeps the button in the tab order, and the keyboard opens the tooltip', async () => {
    render(<Screen reason={REASON} />)

    await userEvent.tab()

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Publicar' }),
    )
    expect((await screen.findAllByText(REASON)).length).toBeGreaterThan(1)
  })

  it('does nothing on click or Enter', async () => {
    const onClick = vi.fn()
    render(<Screen reason={REASON} onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))
    await userEvent.keyboard('{Enter}')

    expect(onClick).not.toHaveBeenCalled()
  })

  it('draws the control as it came when there is no reason', async () => {
    const onClick = vi.fn()
    render(<Screen onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Publicar' })
    expect(button.hasAttribute('aria-disabled')).toBe(false)

    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('has no axe violation, closed and open', async () => {
    const { container } = render(<Screen reason={REASON} />)

    const closed = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(closed.violations.map((violation) => violation.id)).toEqual([])

    await userEvent.tab()
    await screen.findAllByText(REASON)

    const open = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
        region: { enabled: false },
      },
    })
    expect(open.violations.map((violation) => violation.id)).toEqual([])
  })
})
