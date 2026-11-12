import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import * as React from 'react'

import { useDismissableDialog } from '#/components/common/confirm-dialog/use-open-on-request'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import type { Merge } from '@maiyu/shared'

import { ConfirmDialogProvider } from './confirm-dialog-context'

/**
 * Opens the confirmation **without a trigger**, for whoever opens it through an effect and not by
 * click -- table row, menu item, dynamic target.
 *
 * It is not a style shortcut. `AlertDialogTrigger` only gets `onClick` on a render
 * after the one that mounts it (`floatingRootContext` reaches the store in a
 * *layout* effect and is read by a `useSyncExternalStore` that only subscribes in a
 * *passive* effect), and the caller `triggerRef.current.click()` fires in the same
 * commit the trigger mounts. Since these callers mount the confirmation together
 * with the target (`{target && <ConfirmDialog key={nonce} />}`), the trigger **always**
 * just mounted: the click landed on a `<button>` without a handler and nothing opened.
 *
 * Whoever opens by user click stays on the `ref`: there the trigger has been
 * mounted for a long time.
 *
 * Born in `React.useState(createConfirmHandle)`, never in module scope: on
 * SSR a module handle would be a single store across requests.
 */
export const createConfirmHandle = AlertDialogPrimitive.createHandle

export type ConfirmHandle = ReturnType<typeof createConfirmHandle>

export type ConfirmDialogProps = Merge<
  React.ComponentProps<typeof AlertDialogTrigger>,
  {
    readonly isPending: boolean
    /** Who opens it, when there is no click. See `createConfirmHandle`. */
    readonly handle?: ConfirmHandle
    readonly onConfirm: (close: () => void) => void
    /** `false` for a reversible action (restore, resend). Destructive by default. */
    readonly destructive?: boolean
    readonly testId?: string
    /**
     * Where focus goes on close. Without it, Base UI's default: the trigger,
     * or the element focused before opening. Opened from a menu item, pass
     * the `finalFocus` of `useMenuDialog`.
     */
    readonly finalFocus?: AlertDialogPrimitive.Popup.Props['finalFocus']
    /** The alert parts: `ConfirmDialogHeader` and `ConfirmDialogFooter`. */
    readonly children: React.ReactNode
  }
>

/**
 * Confirmation before an action the caller runs.
 *
 * It is an **AlertDialog**, not a Dialog: the alert does not close on outside click, and a distracted
 * click cannot be the answer to "delete permanently?". Esc closes (cancels),
 * as in the Base UI default: closing confirms nothing.
 *
 * Composed, not one text prop per piece: the title, the description and the
 * labels are markup, and markup goes through a slot -- the off-pattern screen puts an
 * `<Alert>` in the description without that becoming one more optional prop for the
 * other thirty-three.
 *
 * **`children` is the alert content, not the trigger one.** What shows
 * inside the button that opens it lives in the `render` element
 * (`render={<Button><TrashIcon />Excluir</Button>}`); a bare trigger, opened through
 * `ref` or `handle`, has no content at all.
 */
export function ConfirmDialog({
  ref,
  handle,
  isPending,
  onConfirm,
  destructive = true,
  testId,
  finalFocus,
  children,
  ...rest
}: ConfirmDialogProps): React.JSX.Element {
  const { closeRef, close } = useDismissableDialog()

  const confirm = (): void => {
    if (isPending) return
    onConfirm(close)
  }

  // The memo only holds when the caller passes a stable `onConfirm`: most
  // write an inline arrow, and then the object is new on every render
  // anyway. It stays because it costs nothing and pays off when the caller memoizes; do not
  // count on it to avoid re-renders.
  const value = { isPending, destructive, closeRef, confirm }

  return (
    <AlertDialog handle={handle}>
      {/* With `handle` and without `render` there is no trigger: the bare button stayed in the
          DOM of each row as an invisible, unnamed focus stop (67 on /tables). */}
      {(!handle || rest.render) && <AlertDialogTrigger {...rest} ref={ref} />}
      <AlertDialogContent data-testid={testId} finalFocus={finalFocus}>
        <ConfirmDialogProvider value={value}>{children}</ConfirmDialogProvider>
      </AlertDialogContent>
    </AlertDialog>
  )
}
