import type * as React from 'react'

import { cn } from '#/lib/cn'
import { PROJECT_STATUS_LABELS } from '#/lib/labels'
import type { ProjectStatus } from '@maiyu/shared'

type ProjectStatusBadgeProps = {
  status: ProjectStatus
  className?: string
}

/**
 * Says whether the project is live or in validation, as plain text: no dot, no chip, no
 * uppercase (`docs/DESIGN.md` §11). It lives in the public shell because the portfolio draws
 * the same line: written twice, one of the two would end up promising "live" for what the
 * city hall or the school are still testing.
 */
export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps): React.JSX.Element {
  return (
    <span className={cn('text-small text-muted-foreground', className)}>
      {PROJECT_STATUS_LABELS[status]()}
    </span>
  )
}
