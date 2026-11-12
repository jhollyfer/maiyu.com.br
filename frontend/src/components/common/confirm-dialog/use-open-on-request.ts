import React, { useRef } from 'react'

import { createDialogHandle } from '#/lib/dialog-handle'
import type { DialogHandle } from '#/lib/dialog-handle'

/**
 * Opens the dynamic-target dialog (`{target && <X key={target.nonce} />}`) through the
 * handle, once per request.
 *
 * The effect of the `lib/dialog-handle.ts` pattern opened whenever it ran with a
 * target: the target never goes back to `null`, and when the list re-suspended the effect
 * ran again and reopened the confirmation the user had already closed,
 * covering the list. Here only a new `nonce` opens it.
 */
export function useOpenOnRequest(
  target: { nonce: number } | null,
  handle: { open: (triggerId: null) => void },
): void {
  const openedNonceRef = React.useRef(0)

  React.useEffect(() => {
    if (!target || target.nonce === openedNonceRef.current) return
    openedNonceRef.current = target.nonce
    handle.open(null)
  }, [target, handle])
}

/**
 * A Dialog/Sheet with a visible trigger that something else also opens (a
 * click on the table row opens the edit sheet of its pencil button). Pass
 * `handle` to the root and `handle` + `id={triggerId}` to the trigger; `open()`
 * opens through the handle *as that trigger*, so focus returns to it on close.
 * The old `ref.current.click()` on the trigger does nothing whenever the
 * trigger has not been wired yet, and fails silently.
 */
export function useTriggerDialog(): {
  handle: DialogHandle
  triggerId: string
  open: () => void
} {
  const [handle] = React.useState(createDialogHandle)
  const triggerId = React.useId()
  const open = (): void => handle.open(triggerId)
  return { handle, triggerId, open }
}

/** The requested target and the counter that tells one request from the previous one. */
export type RequestedTarget<T> = { item: T; nonce: number }

/**
 * The target + handle pair of a dynamic-target dialog, already opened by
 * `useOpenOnRequest`: `request(item)` swaps the target and opens. It was the same
 * `useState` + `createHandle` + `nonce` spelled out for each dialog.
 */
export function useRequestedTarget<
  T,
  THandle extends { open: (triggerId: null) => void },
>(
  createHandle: () => THandle,
): {
  target: RequestedTarget<T> | null
  handle: THandle
  request: (item: T) => void
} {
  const [target, setTarget] = React.useState<RequestedTarget<T> | null>(null)
  const [handle] = React.useState(createHandle)

  useOpenOnRequest(target, handle)

  const request = (item: T): void => {
    setTarget((previous) => ({ item, nonce: (previous?.nonce ?? 0) + 1 }))
  }

  return { target, handle, request }
}

/**
 * One submit at a time. The mutation `isPending` only reaches the screen on the next
 * render, and the second click of a double click comes before it: the ref holds
 * immediately. The caller releases it in `onSettled` (or earlier, if it gives up the submit).
 *
 * It was the same `useRef(false)` + guard + `onSettled` written in each button that
 * cannot send twice (react, delete event, create workspace).
 */
export function useSingleFlight(): (
  start: (release: () => void) => void,
) => void {
  const busyRef = React.useRef(false)

  return (start: (release: () => void) => void) => {
    if (busyRef.current) return
    busyRef.current = true
    start(() => {
      busyRef.current = false
    })
  }
}

// Closes an uncontrolled Dialog/Sheet without `open`/`onOpenChange` or `useState`:
// anchor `closeRef` on the VISIBLE close button of the footer
// (`<DialogClose render={<Button ref={closeRef}>Cancelar</Button>} />`, or
// SheetClose) and call `close()` in the mutation `onSuccess`. An error keeps the
// modal open (the toast reports it). No `<DialogClose className="hidden" />` just for the
// ref: reuse Cancelar/Fechar. See dialog-pattern / sheet-pattern.
//
// The button holding `closeRef` NEVER takes `disabled`. `close()` is a
// `.click()`, and Base UI short-circuits the `onClick` of a disabled button
// (`use-button`). Since TanStack Query's `mutate`-level callback runs
// inside the `dispatch('success')` batch (before the React commit that
// would reset `isPending`), a `disabled={isPending}` there lets the click fall into
// nothing and the modal stays stuck open. The pending `disabled` lives only on the
// primary action.
export function useDismissableDialog(): {
  closeRef: React.RefObject<HTMLButtonElement | null>
  close: () => void
} {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const close = (): void | undefined => closeRef.current?.click()
  return { closeRef, close }
}
