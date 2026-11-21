// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from '#/components/common/confirm-dialog/confirm-dialog'
import {
  ConfirmDialogChallenge,
  ConfirmDialogWarning,
} from '#/components/common/confirm-dialog/confirm-dialog-challenge'
import {
  ConfirmDialogCancel,
  ConfirmDialogConfirm,
  ConfirmDialogFooter,
} from '#/components/common/confirm-dialog/confirm-dialog-footer'
import {
  ConfirmDialogDescription,
  ConfirmDialogHeader,
  ConfirmDialogTitle,
} from '#/components/common/confirm-dialog/confirm-dialog-header'
import type { ChallengeRandom } from '#/lib/confirm-challenge'
import { m } from '#/paraglide/messages'

/** Operands 5 and 9, sign draw below 0.5: always "5 + 9", answer 14. */
function fixedRandom(): ChallengeRandom {
  const values = [0.5, 0.99, 0.1]
  let index = 0

  return () => {
    const value = values[index % values.length] ?? 0
    index += 1

    return value
  }
}

type ScreenProps = Readonly<{
  onConfirm: () => void
  withChallenge: boolean
}>

function Screen({ onConfirm, withChallenge }: ScreenProps) {
  return (
    <ConfirmDialog
      render={<button type="button">Abrir</button>}
      isPending={false}
      onConfirm={onConfirm}
    >
      <ConfirmDialogHeader>
        <ConfirmDialogTitle>Excluir de vez?</ConfirmDialogTitle>
        <ConfirmDialogDescription>Não tem volta.</ConfirmDialogDescription>
      </ConfirmDialogHeader>
      {withChallenge && <ConfirmDialogWarning count={3} />}
      {withChallenge && <ConfirmDialogChallenge random={fixedRandom()} />}
      <ConfirmDialogFooter>
        <ConfirmDialogCancel />
        <ConfirmDialogConfirm>Excluir</ConfirmDialogConfirm>
      </ConfirmDialogFooter>
    </ConfirmDialog>
  )
}

/** The confirm button is held (`disabled`) until the question is answered. */
function isConfirmHeld(): boolean {
  return screen
    .getByRole('button', { name: 'Excluir' })
    .hasAttribute('disabled')
}

async function open() {
  await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
  await screen.findByRole('alertdialog')
}

describe('ConfirmDialogChallenge', () => {
  it('without the part, the confirm button is free', async () => {
    const onConfirm = vi.fn()
    render(<Screen onConfirm={onConfirm} withChallenge={false} />)

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('with the part, holds the confirm button until the fixed question is answered right', async () => {
    const onConfirm = vi.fn()
    render(<Screen onConfirm={onConfirm} withChallenge />)

    await open()

    const answer = screen.getByRole('textbox', {
      name: m.kit_confirm_challenge_label({ question: '5 + 9' }),
    })

    expect(isConfirmHeld()).toBe(true)

    await userEvent.type(answer, '13')
    expect(isConfirmHeld()).toBe(true)

    await userEvent.clear(answer)
    await userEvent.type(answer, '14')
    expect(isConfirmHeld()).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('shows the count of what goes away in the warning', async () => {
    render(<Screen onConfirm={vi.fn()} withChallenge />)

    await open()

    expect(
      screen.getByText(m.kit_confirm_warning_items({ count: 3 })),
    ).toBeTruthy()
  })

  it('renews the question on every opening and holds the button again', async () => {
    render(<Screen onConfirm={vi.fn()} withChallenge />)

    await open()
    await userEvent.type(screen.getByRole('textbox'), '14')
    await userEvent.click(screen.getByRole('button', { name: m.kit_cancel() }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())

    await open()

    expect(isConfirmHeld()).toBe(true)
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('')
  })

  it('has no axe violation with the warning and the challenge open', async () => {
    render(<Screen onConfirm={vi.fn()} withChallenge />)

    await open()

    const result = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
        region: { enabled: false },
      },
    })
    expect(result.violations.map((violation) => violation.id)).toEqual([])
  })
})
