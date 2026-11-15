import type * as React from 'react'

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '#/components/ui/alert-dialog'
import { Spinner } from '#/components/ui/spinner'
import { m } from '#/paraglide/messages'

import { useConfirmDialogContext } from './confirm-dialog-context'

export function ConfirmDialogFooter({
  className,
  ...rest
}: React.ComponentProps<typeof AlertDialogFooter>): React.JSX.Element {
  return (
    <AlertDialogFooter
      data-slot="confirm-dialog-footer"
      className={className}
      {...rest}
    />
  )
}

/**
 * The exit. Without children it writes "Cancelar", which is what almost every
 * platform confirmation says.
 *
 * **Never takes `disabled`.** This is the button the `useDismissableDialog`
 * `close()` clicks, and Base UI short-circuits the `onClick` of a
 * disabled button. The `mutate`-level callback runs inside the
 * `dispatch('success')` batch, before the React commit that would reset `isPending`,
 * so the click would land on a still disabled button in the DOM and the alert would stay
 * stuck open. The pending `disabled` lives only on the primary action.
 */
export function ConfirmDialogCancel({
  children = m.kit_cancel(),
  ...rest
}: React.ComponentProps<typeof AlertDialogCancel>): React.JSX.Element {
  const { closeRef } = useConfirmDialogContext('ConfirmDialogCancel')

  return (
    <AlertDialogCancel
      data-slot="confirm-dialog-cancel"
      ref={closeRef}
      {...rest}
    >
      {children}
    </AlertDialogCancel>
  )
}

/**
 * The primary action. The label is the children: "Excluir", "Restaurar", "Sair" --
 * never "Confirmar" when there is a better verb.
 */
export function ConfirmDialogConfirm({
  children,
  ...rest
}: React.ComponentProps<typeof AlertDialogAction>): React.JSX.Element {
  const { confirm, destructive, isPending } = useConfirmDialogContext(
    'ConfirmDialogConfirm',
  )

  let variant: 'destructive' | 'default' = 'default'
  if (destructive) variant = 'destructive'

  return (
    <AlertDialogAction
      data-slot="confirm-dialog-confirm"
      type="button"
      variant={variant}
      disabled={isPending}
      onClick={confirm}
      {...rest}
    >
      {isPending && (
        <Spinner aria-label={m.kit_loading()} data-icon="inline-start" />
      )}
      {children}
    </AlertDialogAction>
  )
}
