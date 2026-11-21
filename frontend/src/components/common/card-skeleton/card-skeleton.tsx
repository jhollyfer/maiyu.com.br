import type * as React from 'react'

import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'

/**
 * The three pieces of a dashboard while it loads, in the shape of the final card: a metric (title and
 * big number), a chart (title and plot area) and an activity list (avatar, two lines). The page lays
 * them out in its own grid (`grid gap-4 sm:grid-cols-2 lg:grid-cols-4`); the pieces never set the
 * width, so one column at 375px comes from the grid, not from here. Decorative: the route's
 * `pendingComponent` carries the `aria-busy` and the announced status.
 */
export function MetricCardSkeleton(): React.JSX.Element {
  return (
    <Card data-slot="metric-card-skeleton">
      <CardHeader>
        <Skeleton className="h-4 w-28 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-24 max-w-full" />
      </CardContent>
    </Card>
  )
}

export function ChartSkeleton(): React.JSX.Element {
  return (
    <Card data-slot="chart-skeleton">
      <CardHeader>
        <Skeleton className="h-5 w-48 max-w-full" />
        <Skeleton className="h-3 w-32 max-w-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-52 w-full" />
      </CardContent>
    </Card>
  )
}

export function ActivitySkeleton({
  rows = 5,
}: {
  readonly rows?: number
}): React.JSX.Element {
  return (
    <Card data-slot="activity-skeleton">
      <CardHeader>
        <Skeleton className="h-5 w-40 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center gap-4">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
