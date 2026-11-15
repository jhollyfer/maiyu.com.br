import { Spinner } from '#/components/ui/spinner'
import { m } from '#/paraglide/messages'

export function RoutePending(): React.JSX.Element {
  return (
    <div
      data-slot="route-pending"
      className="min-h-page-state flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner
          aria-label={m.kit_loading()}
          className="size-10 text-primary"
        />
        {/* The Spinner announces kit_loading (role=status); the text is visual only. */}
        <p aria-hidden className="text-muted-foreground">
          {m.kit_loading()}
        </p>
      </div>
    </div>
  )
}
