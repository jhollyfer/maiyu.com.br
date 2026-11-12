import {
  ArchiveIcon,
  ArrowCounterClockwiseIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import * as React from 'react'

import { ConfirmDialog } from '#/components/common/confirm-dialog/confirm-dialog'
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
import { DropdownMenuItem } from '#/components/ui/dropdown-menu'
import type { ConfirmHandle } from '#/lib/dialog-handle'
import { m } from '#/paraglide/messages'
import type { Merge } from '@maiyu/shared'

type RowActionsItemProps = Readonly<{
  /** The handle of the alert this item opens (`createConfirmHandle`). */
  handle: ConfirmHandle
}>

type RowActionsActionProps = Readonly<
  Merge<
    RowActionsItemProps,
    {
      /** The `data-slot` of the item, for the E2E and the styles that read it. */
      slot?: string
      icon?: React.ReactNode
      label: string
      destructive?: boolean
    }
  >
>

/**
 * A menu item that asks for confirmation. The generic piece: the archive, restore and delete
 * items are this one with a fixed icon and label, and a domain action ("Reenviar convite",
 * "Marcar como lido") is this one with its own.
 *
 * The item only opens the alert: `handle.open(null)` on click, and the menu closes like
 * any item. The alert is `RowActionsConfirm` or `RowActionsActionDialog`, a sibling of the menu.
 */
export function RowActionsAction({
  slot = 'row-actions-action',
  icon,
  label,
  destructive = false,
  handle,
}: RowActionsActionProps): React.JSX.Element {
  let variant: 'destructive' | 'default' = 'default'
  if (destructive) variant = 'destructive'

  return (
    <DropdownMenuItem
      data-slot={slot}
      variant={variant}
      onClick={() => handle.open(null)}
    >
      {icon}
      {label}
    </DropdownMenuItem>
  )
}

type RowActionsConfirmProps = Readonly<{
  handle: ConfirmHandle
  /** The row's mutation, already with the id: `() => archive.mutate(row.id)`. */
  onConfirm: () => void
  /** The same mutation's `isPending`: the confirm button holds while it runs. */
  isPending: boolean
  /** The text of the button that confirms. */
  confirmLabel: string
  /** An irreversible action paints the confirm button red. */
  destructive?: boolean
  /**
   * `ConfirmDialogTitle` and `ConfirmDialogDescription`.
   *
   * The text stays with the screen because it is the screen's: some listings state the concrete
   * effect ("sai da vitrine na hora") and others the generic sentence. Fixing it here
   * would force the generic one on all of them.
   */
  children: React.ReactNode
}>

/** A menu item's alert, for `RowActions`' `dialogs`. */
export function RowActionsConfirm({
  handle,
  onConfirm,
  isPending,
  confirmLabel,
  destructive = false,
  children,
}: RowActionsConfirmProps): React.JSX.Element {
  return (
    <ConfirmDialog
      handle={handle}
      destructive={destructive}
      onConfirm={onConfirm}
      isPending={isPending}
    >
      <ConfirmDialogHeader>{children}</ConfirmDialogHeader>
      <ConfirmDialogFooter>
        <ConfirmDialogCancel />
        <ConfirmDialogConfirm>{confirmLabel}</ConfirmDialogConfirm>
      </ConfirmDialogFooter>
    </ConfirmDialog>
  )
}

type RowActionsActionDialogProps = Readonly<{
  handle: ConfirmHandle
  title: string
  description: string
  /** The text of the button that confirms. */
  confirmLabel: string
  destructive?: boolean
  /** The domain action. A promise holds the confirm button until it settles, then the alert closes. */
  onAction: () => void | Promise<void>
  /** For a mutation the screen already owns (`isPending`); without it the dialog tracks the promise. */
  isPending?: boolean
}>

/**
 * The alert of a domain action, with the text as props: title, description and confirm label.
 *
 * `RowActionsConfirm` stays for the screen that needs markup in the description; this one is for
 * the common case, plain text. When `onAction` is async the dialog holds the button while it runs
 * and closes on success; on failure it stays open so the caller's error surface can speak.
 */
export function RowActionsActionDialog({
  handle,
  title,
  description,
  confirmLabel,
  destructive = false,
  onAction,
  isPending = false,
}: RowActionsActionDialogProps): React.JSX.Element {
  const [running, setRunning] = React.useState(false)

  const run = async (close: () => void): Promise<void> => {
    setRunning(true)
    try {
      await onAction()
      close()
    } catch {
      // The failure surface (toast) is the caller's mutation; the alert only stays open.
    } finally {
      setRunning(false)
    }
  }

  return (
    <ConfirmDialog
      handle={handle}
      destructive={destructive}
      isPending={isPending || running}
      onConfirm={(close) => {
        void run(close)
      }}
    >
      <ConfirmDialogHeader>
        <ConfirmDialogTitle>{title}</ConfirmDialogTitle>
        <ConfirmDialogDescription>{description}</ConfirmDialogDescription>
      </ConfirmDialogHeader>
      <ConfirmDialogFooter>
        <ConfirmDialogCancel />
        <ConfirmDialogConfirm>{confirmLabel}</ConfirmDialogConfirm>
      </ConfirmDialogFooter>
    </ConfirmDialog>
  )
}

/** Archive the row. Only appears on what is not yet archived. */
export function RowActionsArchive(
  props: RowActionsItemProps,
): React.JSX.Element {
  return (
    <RowActionsAction
      slot="row-actions-archive"
      icon={<ArchiveIcon />}
      label={m.kit_archive()}
      {...props}
    />
  )
}

/** Take the row out of the trash. Only appears on what is archived. */
export function RowActionsUnarchive(
  props: RowActionsItemProps,
): React.JSX.Element {
  return (
    <RowActionsAction
      slot="row-actions-unarchive"
      icon={<ArrowCounterClockwiseIcon />}
      label={m.kit_restore()}
      {...props}
    />
  )
}

type RowActionsDeleteProps = Readonly<
  Merge<
    RowActionsItemProps,
    {
      /** The item's text. "Excluir" by default. */
      label?: string
    }
  >
>

/**
 * Delete the row for good. Only on what is already archived and only for whoever may.
 *
 * The use-case refuses a live record with `409` and the code `<RESOURCE>_NOT_ARCHIVED`
 * (backend spec, item 7): offering the item outside that is offering an error.
 */
export function RowActionsDelete({
  label = m.kit_delete(),
  ...props
}: RowActionsDeleteProps): React.JSX.Element {
  return (
    <RowActionsAction
      slot="row-actions-delete"
      icon={<TrashIcon />}
      label={label}
      destructive
      {...props}
    />
  )
}

/**
 * Delete the row directly, with no archiving step (a contact to erase under the LGPD, a record
 * that was never in the trash). It does not assume `<RESOURCE>_NOT_ARCHIVED`: use it only where the
 * use-case deletes a live record. The archived-only flow keeps `RowActionsDelete`.
 */
export function RowActionsRemove({
  label = m.kit_delete(),
  ...props
}: RowActionsDeleteProps): React.JSX.Element {
  return (
    <RowActionsAction
      slot="row-actions-remove"
      icon={<TrashIcon />}
      label={label}
      destructive
      {...props}
    />
  )
}

type RowActionsRemoveDialogProps = Readonly<
  Merge<
    Omit<
      RowActionsActionDialogProps,
      'title' | 'description' | 'confirmLabel' | 'destructive'
    >,
    {
      /** Names the record: "Excluir o contato Maria?". Without it, the generic sentence. */
      title?: string
      description?: string
      confirmLabel?: string
    }
  >
>

/** The alert of `RowActionsRemove`: irreversible, with its own text that does not talk about the trash. */
export function RowActionsRemoveDialog({
  title = m.kit_row_remove_title(),
  description = m.kit_row_remove_description(),
  confirmLabel = m.kit_delete(),
  ...rest
}: RowActionsRemoveDialogProps): React.JSX.Element {
  return (
    <RowActionsActionDialog
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      destructive
      {...rest}
    />
  )
}
