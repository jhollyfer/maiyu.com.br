import { WarningIcon } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty'
import { HTTPError, HTTPStatus } from '#/integrations/tanstack-query/http'
import { m } from '#/paraglide/messages'

import { AccessDenied } from './access-denied'

/**
 * The text the user reads, and the only distinction that matters here.
 *
 * A 4xx coming from a `loader` carries a message written for whoever reads the
 * screen ("Tabela privada", "Registro nao encontrado"), and showing it is what
 * separates "the failure is ours" from "this is the situation". A 5xx carries a
 * log message: repeating it helps nobody and may leak implementation detail.
 */
function readMessage(caught: unknown): string {
  const error = HTTPError.from(caught)
  const isHandled =
    error !== null &&
    error.status >= HTTPStatus.BAD_REQUEST &&
    error.status < HTTPStatus.INTERNAL_SERVER_ERROR

  if (isHandled) return error.message

  return m.kit_route_error_description()
}

export function RouteError({
  error,
  resetErrorBoundary,
}: {
  readonly error: unknown
  readonly resetErrorBoundary?: () => void
}): React.JSX.Element {
  const router = useRouter()

  // 403 is not "something went wrong": it is access denied. The backend message
  // here is technical (the policy's), so the screen keeps its own text.
  if (HTTPError.from(error).status === HTTPStatus.FORBIDDEN) {
    return <AccessDenied />
  }

  return (
    <div
      data-slot="route-error"
      data-testid="route-error-page"
      className="min-h-page-state flex items-center justify-center px-4"
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WarningIcon aria-hidden="true" className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle role="heading" aria-level={2}>
            {m.kit_layout_route_error_something_went_wrong()}
          </EmptyTitle>
          <EmptyDescription>{readMessage(error)}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            data-testid="retry-btn"
            onClick={() => {
              // The `defaultErrorComponent` `reset` clears the error boundary;
              // `invalidate` reruns the tree `loader`s. They are the two sides of
              // "try again", and this is the **only** `router.invalidate()` in the
              // app; in mutation `onSuccess` it only reran the loader to reread
              // the same cache the invalidation had already updated.
              resetErrorBoundary?.()
              void router.invalidate()
            }}
          >
            {m.kit_layout_route_error_try_again()}
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
