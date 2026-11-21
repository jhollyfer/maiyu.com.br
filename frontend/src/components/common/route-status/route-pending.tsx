import { Spinner } from '#/components/ui/spinner'
import { m } from '#/paraglide/messages'

/**
 * The root fallback (`defaultPendingComponent` of the router): the only full-screen wait. A route with
 * a `loader` never uses it as its own `pendingComponent`: it draws the skeleton of its final shape
 * (`_standards/frontend.md` §5, `DECISIONS.md` #808), and `eslint.config.js` refuses the other way.
 */
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
