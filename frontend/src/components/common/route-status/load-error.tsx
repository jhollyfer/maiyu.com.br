import { ArrowClockwiseIcon, CloudWarningIcon } from '@phosphor-icons/react'
import React from 'react'

import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty'
import { m } from '#/paraglide/messages'

type LoadErrorProps = {
  readonly message?: string
  readonly refetch: () => void
}

export function LoadError({
  message = m.kit_load_error_there_problem_loading_data(),
  refetch,
}: LoadErrorProps): React.JSX.Element {
  return (
    <Empty
      data-slot="load-error"
      data-testid="load-error-page"
      className="from-muted/50 to-background h-full bg-linear-to-b from-30%"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudWarningIcon />
        </EmptyMedia>
        <EmptyTitle>{m.kit_layout_load_error_there_problem()}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          data-testid="retry-btn"
          variant="outline"
          size="sm"
          onClick={() => {
            refetch()
          }}
        >
          <ArrowClockwiseIcon data-icon="inline-start" />
          {m.kit_try_again()}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
