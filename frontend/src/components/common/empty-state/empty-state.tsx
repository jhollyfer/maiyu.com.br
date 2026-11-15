import * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty'
import { cn } from '#/lib/cn'
import type { Merge } from '@maiyu/shared'

import { EmptyStateProvider, useEmptyStateSize } from './empty-state-context'
import type { EmptyStateSize } from './empty-state-context'

/**
 * Why the list is empty (`_standards/frontend.md` §10.1): the text and the
 * exit change with the reason, so it stays visible in the DOM for the test and for
 * CSS and the screen is forced to choose one.
 */
export type EmptyStateReason =
  'first-use' | 'filtered' | 'trash' | 'forbidden' | 'error'

const ROLE = {
  'first-use': undefined,
  filtered: undefined,
  trash: undefined,
  forbidden: undefined,
  error: 'alert',
} as const satisfies Record<EmptyStateReason, 'alert' | undefined>

const SIZE_CLASS = {
  default: '',
  section: 'rounded-xl border border-border/70 py-16',
} as const satisfies Record<EmptyStateSize, string>

const TITLE_CLASS = {
  default: '',
  section: 'text-lead',
} as const satisfies Record<EmptyStateSize, string>

const DESCRIPTION_CLASS = {
  default: '',
  section: 'text-supporting',
} as const satisfies Record<EmptyStateSize, string>

type EmptyStateProps = Merge<
  React.ComponentProps<typeof Empty>,
  {
    readonly reason: EmptyStateReason
    readonly size?: EmptyStateSize
  }
>

/**
 * A screen's empty state, on top of shadcn's `ui/empty`.
 *
 * Compound and not `title`/`description`/`action` props: the screen decides whether there is an action
 * (first use has "Criar", a search with no results has "Limpar filtros", no
 * permission has none) and what goes in the text.
 * _doc-lib/shadcn.md#empty (https://ui.shadcn.com/docs/components/base/empty).
 */
export function EmptyState({
  reason,
  size = 'default',
  className,
  ...props
}: EmptyStateProps): React.JSX.Element {
  return (
    <EmptyStateProvider value={size}>
      <Empty
        data-slot="empty-state"
        data-reason={reason}
        // An urgent error is announced; the rest just appears (`frontend.md` §10.1).
        role={ROLE[reason]}
        className={cn(SIZE_CLASS[size], className)}
        {...props}
      />
    </EmptyStateProvider>
  )
}

export function EmptyStateHeader(
  props: React.ComponentProps<typeof EmptyHeader>,
): React.JSX.Element {
  return <EmptyHeader {...props} />
}

export function EmptyStateMedia(
  props: React.ComponentProps<typeof EmptyMedia>,
): React.JSX.Element {
  return <EmptyMedia {...props} />
}

export function EmptyStateTitle({
  className,
  ...props
}: React.ComponentProps<typeof EmptyTitle>): React.JSX.Element {
  const size = useEmptyStateSize()

  return <EmptyTitle className={cn(TITLE_CLASS[size], className)} {...props} />
}

export function EmptyStateDescription({
  className,
  ...props
}: React.ComponentProps<typeof EmptyDescription>): React.JSX.Element {
  const size = useEmptyStateSize()

  return (
    <EmptyDescription
      className={cn(DESCRIPTION_CLASS[size], className)}
      {...props}
    />
  )
}

/** Container for one or more actions; use it when the action is not a single button. */
export function EmptyStateContent(
  props: React.ComponentProps<typeof EmptyContent>,
): React.JSX.Element {
  return <EmptyContent {...props} />
}

/**
 * The way out of the empty state when it is an action: a button. When it is navigation, the
 * project renders a `Link` with `buttonVariants` instead, never `render={<Link />}`: Base UI's
 * `Button` forces `role="button"` and erases the link (_doc-lib/shadcn.md#button).
 */
export function EmptyStateAction({
  variant = 'outline',
  ...props
}: React.ComponentProps<typeof Button>): React.JSX.Element {
  return <Button data-slot="empty-state-action" variant={variant} {...props} />
}
