import type * as React from 'react'

import { Skeleton } from '#/components/ui/skeleton'
import { m } from '#/paraglide/messages'

/**
 * The rich editor's place while its chunk (Tiptap and ProseMirror) arrives, with the toolbar and
 * the writing area at the real editor's height, so the form does not jump (`_standards/frontend.md`
 * §9.4). The toolbar wraps below `sm`, so 375px never scrolls sideways.
 */
export function RichEditorSkeleton(): React.JSX.Element {
  return (
    <div
      data-slot="rich-editor-skeleton"
      aria-busy="true"
      className="flex flex-col gap-3 rounded-md border p-3"
    >
      <span className="sr-only" role="status">
        {m.kit_loading()}
      </span>
      <div className="flex flex-wrap gap-2 border-b pb-2" aria-hidden>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="size-8" />
        ))}
      </div>
      <Skeleton className="h-32 w-full" aria-hidden />
    </div>
  )
}
