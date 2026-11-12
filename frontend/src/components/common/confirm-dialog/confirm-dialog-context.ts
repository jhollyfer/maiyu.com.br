import * as React from 'react'

/**
 * What the whole confirmation shares -- and nothing else.
 *
 * The action, its weight and the pending state stay here because whoever declares them is the screen,
 * at the top, and whoever uses them are the footer buttons, two levels below. Passing them
 * by prop down there would repeat all three in every `ConfirmDialogConfirm` of every
 * screen.
 *
 * The text is **not** here: it is markup, and markup goes through a slot.
 */
export type ConfirmDialogContextValue = {
  /** Disables only the primary action; Cancelar never. */
  readonly isPending: boolean
  /** An irreversible action paints the confirm button red. */
  readonly destructive: boolean
  /**
   * Anchored on the **visible** Cancelar, which is the button `close()` clicks.
   * See `useDismissableDialog`.
   */
  readonly closeRef: React.RefObject<HTMLButtonElement | null>
  /** The screen `onConfirm`, already with `close` bound. */
  readonly confirm: () => void
}

const ConfirmDialogContext =
  React.createContext<ConfirmDialogContextValue | null>(null)

export const ConfirmDialogProvider = ConfirmDialogContext.Provider

/**
 * The confirmed action, for whoever is inside `ConfirmDialog`.
 *
 * The `consumer` goes into the message so the error says **which** part was left outside the
 * provider -- without it the `throw` reports "missing provider" and leaves the search
 * to whoever reads the stack.
 */
export function useConfirmDialogContext(
  consumer: string,
): ConfirmDialogContextValue {
  const value = React.use(ConfirmDialogContext)
  if (!value)
    throw new Error(`\`${consumer}\` precisa estar dentro de \`ConfirmDialog\``)
  return value
}
