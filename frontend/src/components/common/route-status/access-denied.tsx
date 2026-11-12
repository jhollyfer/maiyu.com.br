import { useRouter } from '@tanstack/react-router'
import type React from 'react'

import {
  EmptyState,
  EmptyStateAction,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateTitle,
} from '#/components/common/empty-state/empty-state'
import { m } from '#/paraglide/messages'

const RESTRICTED_CLASS =
  'from-muted/50 to-background h-full bg-linear-to-b from-30%'

export function AccessDenied({
  description = m.kit_access_denied_do_not_have_permission_access(),
}: {
  readonly description?: string
}): React.JSX.Element {
  const router = useRouter()

  return (
    <EmptyState
      reason="forbidden"
      data-slot="access-denied"
      data-testid="access-denied-page"
      className={RESTRICTED_CLASS}
    >
      <EmptyStateTitle>{m.kit_access_denied()}</EmptyStateTitle>
      <EmptyStateDescription>{description}</EmptyStateDescription>
      <EmptyStateContent>
        <EmptyStateAction
          variant="outline"
          onClick={() => {
            router.history.back()
          }}
        >
          {m.kit_back()}
        </EmptyStateAction>
      </EmptyStateContent>
    </EmptyState>
  )
}

/**
 * No-access screen for those who can fix it by signing in. The sign-in action is
 * the project's (its route and its `redirect`), so it comes in as `children`, and
 * whoever already has a session passes none. Differs from `AccessDenied`, which
 * offers "Voltar".
 */
export function RestrictedEmpty({
  title,
  description,
  children,
}: {
  readonly title: string
  readonly description: string
  readonly children?: React.ReactNode
}): React.JSX.Element {
  return (
    <EmptyState reason="forbidden" className={RESTRICTED_CLASS}>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      <EmptyStateDescription>{description}</EmptyStateDescription>
      {children && <EmptyStateContent>{children}</EmptyStateContent>}
    </EmptyState>
  )
}
