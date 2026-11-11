import { Field, FieldGroup } from '#/components/ui/field'
import { Skeleton } from '#/components/ui/skeleton'

export type FormShellSkeletonProps = Readonly<{
  /** How many label + input pairs the form shows. */
  fields?: number
}>

/**
 * The form screen while its route loads: the header with back arrow and
 * title, and the fields, in the same place the `FormShell` draws them, so the
 * page does not jump when the form arrives.
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
      <div className="flex items-center gap-2 border-b p-4">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-6 w-48" />
      </div>
      <FieldGroup className="gap-4 p-4">
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
