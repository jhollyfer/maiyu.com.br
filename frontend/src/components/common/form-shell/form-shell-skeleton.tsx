import { Field, FieldGroup } from '#/components/ui/field'
import { Skeleton } from '#/components/ui/skeleton'
import { m } from '#/paraglide/messages'

export type FormShellSkeletonProps = Readonly<{
  /** How many label + input pairs the form shows. */
  fields?: number
}>

/**
 * The form screen while its route loads: the header with back arrow and
 * title, and the fields, in the same place the `FormShell` draws them, so the
 * page does not jump when the form arrives. One field per row at every width, as the
 * `FormShell` does, so the 375px phone gets the same shape as the desktop.
 */
export function FormShellSkeleton({
  fields = 4,
}: FormShellSkeletonProps): React.JSX.Element {
  return (
    <div
      data-slot="form-shell-skeleton"
      aria-busy="true"
      className="flex flex-col"
    >
      <span className="sr-only" role="status">
        {m.kit_loading()}
      </span>
      <div className="flex items-center gap-2 border-b p-4" aria-hidden>
        <Skeleton className="size-8 shrink-0 rounded-md" />
        <Skeleton className="h-6 w-48 max-w-full" />
      </div>
      <FieldGroup className="gap-4 p-4" aria-hidden>
        {Array.from({ length: fields }, (_, index) => (
          <Field key={index} data-slot="form-shell-skeleton-field">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </Field>
        ))}
      </FieldGroup>
    </div>
  )
}
