import type * as React from 'react'

import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/cn'
import { PROJECT_STATUS_LABELS } from '#/lib/labels'
import type { ProjectStatus } from '@maiyu/shared'

/**
 * The dot color per status: ink for what is live, the single accent for what
 * is still in validation. A lookup and not a ternary, and a closed key: a new status
 * without a color does not compile.
 */
const DOT = {
  production: 'bg-foreground',
  validation: 'bg-highlight',
} satisfies Record<ProjectStatus, string>

type ProjectStatusBadgeProps = {
  status: ProjectStatus
  className?: string
}

/**
 * The badge that says whether the project is live or in validation.
 *
 * It lives in the public shell because the home (`work.tsx`) and the portfolio draw the
 * same badge: written twice, one of the two would end up promising "live" for
 * what the city hall or the school are still testing.
 */
export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps): React.JSX.Element {
  return (
    <Badge
      variant="ghost"
      className={cn(
        'h-auto gap-2 rounded-none px-0 py-0 text-micro font-medium tracking-[0.14em] text-muted-foreground uppercase',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5', DOT[status])} />
      {PROJECT_STATUS_LABELS[status]()}
    </Badge>
  )
}
