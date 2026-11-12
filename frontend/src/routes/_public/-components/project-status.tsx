import type * as React from 'react'

import { Badge } from '#/components/ui/badge'
import { PROJECT_STATUS_LABELS } from '#/lib/labels'
import type { ProjectStatus } from '#/lib/projects'
import { cn } from '#/lib/utils'

/**
 * A cor do ponto por status: mata para o que está no ar, urucum para o que
 * ainda está em validação. Lookup e não ternário, e chave fechada: status novo
 * sem cor não compila.
 */
const DOT: Record<ProjectStatus, string> = {
  production: 'bg-forest dark:bg-brand-green',
  validation: 'bg-urucum',
}

type ProjectStatusBadgeProps = {
  status: ProjectStatus
  className?: string
}

/**
 * O selo que diz se o projeto está no ar ou em validação.
 *
 * Mora na casca pública porque a home (`work.tsx`) e o portfólio desenham o
 * mesmo selo: escrito duas vezes, um dos dois acabaria prometendo "no ar" para
 * o que a prefeitura ou a escola ainda estão testando.
 */
export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps): React.JSX.Element {
  return (
    <Badge
      variant="outline"
      className={cn('h-auto gap-2 px-3 py-1 text-micro font-medium', className)}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', DOT[status])}
      />
      {PROJECT_STATUS_LABELS[status]()}
    </Badge>
  )
}
