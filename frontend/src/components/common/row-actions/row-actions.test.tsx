// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  ConfirmDialogDescription,
  ConfirmDialogTitle,
} from '#/components/common/confirm-dialog/confirm-dialog-header'
import { RowActions } from '#/components/common/row-actions/row-actions'
import {
  RowActionsAction,
  RowActionsActionDialog,
  RowActionsConfirm,
  RowActionsDelete,
  RowActionsRemove,
  RowActionsRemoveDialog,
} from '#/components/common/row-actions/row-actions-items'
import { DropdownMenuItem } from '#/components/ui/dropdown-menu'
import { createConfirmHandle } from '#/lib/dialog-handle'
import { m } from '#/paraglide/messages'

function Row({ onConfirm }: Readonly<{ onConfirm: () => void }>) {
  const [handle] = React.useState(() => createConfirmHandle())

  return (
    <RowActions
      dialogs={
        <RowActionsConfirm
          handle={handle}
          destructive
          confirmLabel="Apagar de vez"
          onConfirm={onConfirm}
          isPending={false}
        >
          <ConfirmDialogTitle>Apagar a linha?</ConfirmDialogTitle>
          <ConfirmDialogDescription>Não tem volta.</ConfirmDialogDescription>
        </RowActionsConfirm>
      }
    >
      <DropdownMenuItem>Editar</DropdownMenuItem>
      <RowActionsDelete handle={handle} />
    </RowActions>
  )
}

async function openMenu() {
  await userEvent.click(
    screen.getByRole('button', { name: m.kit_open_actions() }),
  )
}

describe('RowActions', () => {
  it('gives the three-dot trigger an accessible name and opens the menu with the items', async () => {
    render(<Row onConfirm={vi.fn()} />)

    await openMenu()

    expect(await screen.findByRole('menuitem', { name: 'Editar' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: m.kit_delete() })).toBeTruthy()
  })

  it('when the delete item is used, opens the alert, which lives outside the menu', async () => {
    render(<Row onConfirm={vi.fn()} />)

    await openMenu()
    await userEvent.click(
      await screen.findByRole('menuitem', { name: m.kit_delete() }),
    )

    expect(
      await screen.findByRole('alertdialog', { name: 'Apagar a linha?' }),
    ).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('when confirmed in the alert, runs the action once', async () => {
    const onConfirm = vi.fn()
    render(<Row onConfirm={onConfirm} />)

    await openMenu()
    await userEvent.click(
      await screen.findByRole('menuitem', { name: m.kit_delete() }),
    )
    await userEvent.click(
      await screen.findByRole('button', { name: 'Apagar de vez' }),
    )

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

function DomainRow({
  onAction,
  remove = false,
}: Readonly<{ onAction: () => void | Promise<void>; remove?: boolean }>) {
  const [handle] = React.useState(() => createConfirmHandle())

  if (remove)
    return (
      <RowActions
        dialogs={<RowActionsRemoveDialog handle={handle} onAction={onAction} />}
      >
        <RowActionsRemove handle={handle} />
      </RowActions>
    )

  return (
    <RowActions
      dialogs={
        <RowActionsActionDialog
          handle={handle}
          title="Reenviar o convite?"
          description="O e-mail sai de novo."
          confirmLabel="Reenviar"
          onAction={onAction}
        />
      }
    >
      <RowActionsAction handle={handle} label="Reenviar convite" />
    </RowActions>
  )
}

async function openDomainAlert() {
  await openMenu()
  await userEvent.click(
    await screen.findByRole('menuitem', { name: 'Reenviar convite' }),
  )
}

describe('RowActionsAction', () => {
  it('opens its own alert with the given text and runs the action once on confirm', async () => {
    const onAction = vi.fn()
    render(<DomainRow onAction={onAction} />)

    await openDomainAlert()

    expect(
      await screen.findByRole('alertdialog', { name: 'Reenviar o convite?' }),
    ).toBeTruthy()
    expect(screen.getByText('O e-mail sai de novo.')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Reenviar' }))

    expect(onAction).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('holds the confirm button while an async action runs, then closes', async () => {
    let finish: () => void = () => undefined
    const onAction = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    render(<DomainRow onAction={onAction} />)

    await openDomainAlert()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Reenviar' }),
    )

    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: /Reenviar/ })
          .hasAttribute('disabled'),
      ).toBe(true),
    )
    finish()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('keeps the alert open when the action fails', async () => {
    const onAction = vi.fn().mockRejectedValue(new Error('falhou'))
    render(<DomainRow onAction={onAction} />)

    await openDomainAlert()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Reenviar' }),
    )

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: /Reenviar/ })
          .hasAttribute('disabled'),
      ).toBe(false),
    )
    expect(screen.getByRole('alertdialog')).toBeTruthy()
  })
})

describe('RowActionsRemove', () => {
  it('deletes directly with its own text, without the trash wording', async () => {
    const onAction = vi.fn()
    render(<DomainRow remove onAction={onAction} />)

    await openMenu()
    const item = await screen.findByRole('menuitem', { name: m.kit_delete() })
    expect(item.getAttribute('data-slot')).toBe('row-actions-remove')
    await userEvent.click(item)

    expect(
      await screen.findByRole('alertdialog', {
        name: m.kit_row_remove_title(),
      }),
    ).toBeTruthy()
    expect(screen.getByText(m.kit_row_remove_description())).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: m.kit_delete() }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
