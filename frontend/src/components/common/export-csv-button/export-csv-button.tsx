import { DownloadSimpleIcon } from '@phosphor-icons/react'
import * as React from 'react'
import { toast } from 'sonner'

import { useSingleFlight } from '#/components/common/confirm-dialog/use-open-on-request'
import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { notifyError } from '#/lib/form-errors'
import { m } from '#/paraglide/messages'

type ExportCsvButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'onClick' | 'children'
> & {
  /**
   * The rows of the file, header first. The screen's I/O (the table it already holds, or a request
   * for the whole filtered list): the button never fetches. Numbers go as numbers, so `-5` still
   * sums, and text is neutralised against a formula (`lib/csv-export.ts`).
   */
  readonly source: () => Promise<ReadonlyArray<ReadonlyArray<unknown>>>
  /** The file name, with `.csv`. */
  readonly filename: string
  /** The button text; `Exportar CSV` when absent. */
  readonly children?: React.ReactNode
}

function asError(error: unknown): Error {
  if (error instanceof Error) return error
  return new Error(String(error))
}

/**
 * Exports a list as CSV. The CSV code (`lib/csv-export.ts`) is loaded by `import()` on the first
 * press, so a screen that never exports does not carry it; one press at a time (`useSingleFlight`),
 * the spinner on while it runs, and the result told by toast: the count on success, the API error on
 * failure. The button is the only part: where it goes (the `ListShell` header, a toolbar) is the
 * screen's.
 */
export function ExportCsvButton({
  source,
  filename,
  children,
  ...props
}: ExportCsvButtonProps): React.JSX.Element {
  const [pending, setPending] = React.useState(false)
  const singleFlight = useSingleFlight()

  function exportRows(): void {
    singleFlight((release) => {
      setPending(true)

      void (async () => {
        try {
          const rows = await source()
          const { csvBlob, downloadBlob } = await import('#/lib/csv-export')

          downloadBlob(csvBlob(rows), filename)
          // The header is not a record.
          toast.success(
            m.kit_csv_exported({ count: Math.max(rows.length - 1, 0) }),
          )
        } catch (error) {
          notifyError(asError(error), { id: 'kit-csv-export' })
        } finally {
          setPending(false)
          release()
        }
      })()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      data-slot="export-csv-button"
      aria-busy={pending}
      onClick={exportRows}
      {...props}
      disabled={props.disabled || pending}
    >
      {pending && (
        <Spinner aria-label={m.kit_loading()} data-icon="inline-start" />
      )}
      {!pending && <DownloadSimpleIcon data-icon="inline-start" />}
      {children ?? m.kit_csv_export()}
    </Button>
  )
}
