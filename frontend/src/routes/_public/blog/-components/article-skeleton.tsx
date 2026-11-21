import type * as React from 'react'

import { Skeleton } from '#/components/ui/skeleton'

/**
 * The article while the route resolves, in the shape of the final screen: breadcrumb, title, lead,
 * the author line, the 21:10 photo and the body column. A skeleton and not a spinner
 * (`frontend.md` §5, `DECISIONS.md` #808); it is the `pendingComponent` of `$slug.tsx`, so it ships
 * with the route and not in the lazy chunk.
 */
export function ArticleSkeleton(): React.JSX.Element {
  return (
    <div data-slot="article-skeleton" aria-busy="true">
      <header className="pt-32 md:pt-44">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-10 h-12 w-4/5 md:h-16" />
          <Skeleton className="mt-8 h-5 w-3/5" />
          <Skeleton className="mt-3 h-5 w-2/5" />
          <div className="mt-10 flex items-center gap-4 border-t border-border pt-6">
            <Skeleton className="size-10" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </header>
      <div className="mx-auto mt-12 max-w-6xl px-4 md:px-8">
        <Skeleton className="aspect-[21/10] w-full" />
      </div>
      <div className="mx-auto max-w-[44rem] space-y-3 px-4 pt-16 pb-24 md:px-8 md:pt-24">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  )
}
