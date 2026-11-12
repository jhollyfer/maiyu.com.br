import { useBlocker } from '@tanstack/react-router'
import React from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

import { createConfirmHandle } from '#/components/common/confirm-dialog/confirm-dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

type FormShellLeaveGuardProps<TValues extends FieldValues> = {
  readonly form: UseFormReturn<TValues>
}

/**
 * Asks before leaving a form with unsaved changes (frontend.md §4): router
 * navigation goes through `useBlocker` and this alert; reload and tab close
 * get the browser's own `beforeunload` prompt.
 *
 * Dirtiness is read live from `form.subscribe`, not from the render snapshot
 * of `formState.isDirty`: the save resets the form and navigates in the same
 * tick, and a snapshot would still say "dirty" and block the way out.
 */
export function FormShellLeaveGuard<TValues extends FieldValues>({
  form,
}: FormShellLeaveGuardProps<TValues>): React.JSX.Element {
  const dirty = React.useRef(false)
  React.useEffect(
    () =>
      form.subscribe({
        formState: { isDirty: true },
        callback: ({ isDirty }) => {
          dirty.current = isDirty === true
        },
      }),
    [form],
  )

  const blocker = useBlocker({
    shouldBlockFn: () => dirty.current,
    enableBeforeUnload: () => dirty.current,
    withResolver: true,
  })

  // Opened by the router, not by a click: the handle, never a hidden trigger.
  const [handle] = React.useState(createConfirmHandle)
  React.useEffect(() => {
    if (blocker.status === 'blocked') handle.open(null)
  }, [blocker.status, handle])

  return (
    <AlertDialog
      handle={handle}
      onOpenChange={(open) => {
        // Esc or "Continuar editando": stay, and release the navigation.
        if (!open && blocker.status === 'blocked') blocker.reset()
      }}
    >
      <AlertDialogContent data-testid="form-leave-guard">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {m.kit_form_shell_leave_guard_leave_without_saving_2()}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {m.kit_form_shell_leave_guard_changes_form_have_not_been()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {m.kit_form_shell_leave_guard_keep_editing()}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            data-testid="form-leave-guard-confirm"
            onClick={() => {
              if (blocker.status === 'blocked') blocker.proceed()
            }}
          >
            {m.kit_form_shell_leave_guard_leave_without_saving()}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
