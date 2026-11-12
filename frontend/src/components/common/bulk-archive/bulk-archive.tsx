import { ArchiveIcon } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import * as React from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '#/components/common/confirm-dialog/confirm-dialog'
import {
  ConfirmDialogCancel,
  ConfirmDialogConfirm,
  ConfirmDialogFooter,
} from '#/components/common/confirm-dialog/confirm-dialog-footer'
import { ConfirmDialogHeader } from '#/components/common/confirm-dialog/confirm-dialog-header'
import { Button } from '#/components/ui/button'
import { runBulk } from '#/lib/bulk'
import type { BulkOutcome } from '#/lib/bulk'
import { m } from '#/paraglide/messages'

type BulkArchiveProps<TItem> = Readonly<{
  /** The rows selected in the selection bar. */
  items: ReadonlyArray<TItem>
  /** What archiving one item does. Almost always `(item) => archive.mutateAsync(item.id)`. */
  action: (item: TItem) => Promise<unknown>
  /** The resource's cache prefix: `queryKeys.administrator.users.all`. */
  queryKey: QueryKey
  /** `ConfirmDialogTitle` and `ConfirmDialogDescription`: the text is markup. */
  children: React.ReactNode
}>

/**
 * The notice at the end of the batch. The partial report is the point: "7 de 9 arquivados" is
 * actionable, "erro ao arquivar" after seven successes is a lie. Each case is
 * a whole message, with the number inflection inside it and not assembled here.
 */
function bulkArchiveMessage(outcome: BulkOutcome): string {
  const total = outcome.done + outcome.failed

  if (outcome.failed === 0)
    return m.kit_bulk_archive_done({ done: outcome.done })

  if (outcome.done === 0) return m.kit_bulk_archive_none({ total })

  return m.kit_bulk_archive_partial({
    done: outcome.done,
    total,
    failed: outcome.failed,
  })
}

/**
 * Archive the selected rows in one confirmation, item by item through `runBulk`
 * (`lib/bulk.ts`), with the partial report at the end and the resource's cache
 * invalidated once.
 *
 * I/O comes in by prop (`action`, `queryKey`): the piece never imports a mutation.
 *
 * Base: `interclasse/frontend/src/components/common/bulk-archive/bulk-archive.tsx`,
 * moved onto the kit `ConfirmDialog` (`onConfirm(close)` + `isPending`, lowcodejs).
 */
export function BulkArchive<TItem>({
  items,
  action,
  queryKey,
  children,
}: BulkArchiveProps<TItem>): React.JSX.Element {
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = React.useState(false)

  async function confirm(close: () => void): Promise<void> {
    setIsPending(true)

    try {
      const outcome = await runBulk(items, action)

      // The notice first: `invalidateQueries` only resolves when the refetch
      // comes back, and waiting for it here would delay the "7 de 9 arquivados" by a trip
      // to the server that nobody is watching.
      toast.success(bulkArchiveMessage(outcome), { id: 'bulk-archive' })
      close()

      await queryClient.invalidateQueries({ queryKey })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <ConfirmDialog
      isPending={isPending}
      onConfirm={(close) => void confirm(close)}
      render={
        <Button data-slot="bulk-archive" variant="outline">
          <ArchiveIcon />
          {m.kit_archive()}
        </Button>
      }
    >
      <ConfirmDialogHeader>{children}</ConfirmDialogHeader>
      <ConfirmDialogFooter>
        <ConfirmDialogCancel />
        <ConfirmDialogConfirm>{m.kit_archive()}</ConfirmDialogConfirm>
      </ConfirmDialogFooter>
    </ConfirmDialog>
  )
}
