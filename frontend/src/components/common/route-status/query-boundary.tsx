import { WarningCircleIcon } from '@phosphor-icons/react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { useLocation } from '@tanstack/react-router'
import type * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import {
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateHeader,
  EmptyStateMedia,
  EmptyStateTitle,
} from '#/components/common/empty-state/empty-state'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

type QueryBoundaryProps = {
  readonly children: React.ReactNode
}

/**
 * The error boundary around the layouts' `Outlet` (`_standards/frontend.md`
 * §5): `QueryErrorResetBoundary` + `react-error-boundary`.
 *
 * The router's `errorComponent` covers the `loader` that failed; this one covers what
 * fails **after** the screen mounts - a `useSuspenseQuery` that refetches
 * and gets a 5xx. The "tentar de novo" calls Query's `reset`, which clears the error
 * stored in the cache, and only then remounts: without it the remount would read the same
 * error back (_doc-lib/tanstack-query.md#guides/important-defaults).
 *
 * `resetKeys` with the path: navigating to another screen leaves the error state without
 * requiring a click.
 */
export function QueryBoundary({
  children,
}: QueryBoundaryProps): React.JSX.Element {
  const { pathname } = useLocation()

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          resetKeys={[pathname]}
          fallbackRender={({ resetErrorBoundary }) => (
            <QueryBoundaryFallback onRetry={resetErrorBoundary} />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

type QueryBoundaryFallbackProps = {
  readonly onRetry: () => void
}

function QueryBoundaryFallback({
  onRetry,
}: QueryBoundaryFallbackProps): React.JSX.Element {
  return (
    <EmptyState data-slot="query-boundary-fallback" reason="error">
      <EmptyStateHeader>
        <EmptyStateMedia variant="icon">
          <WarningCircleIcon />
        </EmptyStateMedia>
        <EmptyStateTitle>{m.kit_error_title()}</EmptyStateTitle>
        <EmptyStateDescription>
          {m.kit_error_query_description()}
        </EmptyStateDescription>
      </EmptyStateHeader>
      <EmptyStateContent>
        <Button onClick={onRetry}>{m.kit_retry()}</Button>
      </EmptyStateContent>
    </EmptyState>
  )
}
