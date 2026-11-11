import type * as React from 'react'

import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'

/**
 * The top of the alert: icon, title and description.
 *
 * It exists as a part, and not embedded in `ConfirmDialog`, because it is what
 * carries the grid and the alignment `AlertDialogContent` does not give.
 */
export function ConfirmDialogHeader(
  props: React.ComponentProps<typeof AlertDialogHeader>,
): React.JSX.Element {
  return <AlertDialogHeader data-slot="confirm-dialog-header" {...props} />
}

/**
 * The action icon, in the block `AlertDialogHeader` already reserves for it.
 *
 * Outside the title on purpose: the header only switches grid when it sees a
 * `data-slot="alert-dialog-media"` (`has-data-[slot=...]`), and an icon stuffed
 * inside the title does not trigger that switch -- it only pushes the text to the
 * side. It is the only part of the family that does **not** rewrite the `data-slot`, for the
 * same reason: it is those `ui/alert-dialog` selectors that read the slot.
 */
export function ConfirmDialogMedia(
  props: React.ComponentProps<typeof AlertDialogMedia>,
): React.JSX.Element {
  return <AlertDialogMedia {...props} />
}

/**
 * The title names the record: "Remover a categoria Alimentos?", never "Tem
 * certeza?". The primitive announces this element, so it cannot be missing.
 */
export function ConfirmDialogTitle(
  props: React.ComponentProps<typeof AlertDialogTitle>,
): React.JSX.Element {
  return <AlertDialogTitle data-slot="confirm-dialog-title" {...props} />
}

/**
 * What happens on confirm.
 *
 * A slot and not a text prop: it is here that the off-pattern screen puts an `<Alert>`
 * with what blocks the action, or a "notify the members" `<Checkbox>`, without
 * that becoming one more optional prop for all the others.
 */
export function ConfirmDialogDescription(
  props: React.ComponentProps<typeof AlertDialogDescription>,
): React.JSX.Element {
  return (
    <AlertDialogDescription data-slot="confirm-dialog-description" {...props} />
  )
}
