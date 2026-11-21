import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@phosphor-icons/react'
import { cva } from 'class-variance-authority'
import * as React from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '#/components/ui/card'
import { cn } from '#/lib/cn'
import { formatNumber } from '#/lib/i18n'
import { m } from '#/paraglide/messages'

/**
 * A number the screen is about, with its label and, optionally, how it moved.
 *
 * Compound and in the same shape as `MetricCardSkeleton` (label header, then content), which is
 * the loading state: the route's `pendingComponent` draws that skeleton, so the card never has a
 * "loading" prop and the layout does not jump when the number arrives. No icon box and no accent
 * colour on the card: the number is the content (`_standards/frontend.md` §10.8, `DECISIONS.md` #822).
 */
export function StatCard({
  ...props
}: React.ComponentProps<typeof Card>): React.JSX.Element {
  return <Card data-slot="stat-card" {...props} />
}

/** What the number counts. */
export function StatCardLabel({
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>): React.JSX.Element {
  return (
    <CardHeader data-slot="stat-card-header">
      <CardDescription
        data-slot="stat-card-label"
        className={cn('min-w-0 break-words', className)}
        {...props}
      />
    </CardHeader>
  )
}

export function StatCardContent({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>): React.JSX.Element {
  return (
    <CardContent
      data-slot="stat-card-content"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  )
}

/** The number. Tabular figures so a column of cards aligns. */
export function StatCardValue({
  className,
  ...props
}: React.ComponentProps<'p'>): React.JSX.Element {
  return (
    <p
      data-slot="stat-card-value"
      className={cn(
        'text-2xl font-semibold tabular-nums leading-tight',
        className,
      )}
      {...props}
    />
  )
}

/** Whether a rise is the good news (`up`, a sales count) or the bad (`down`, a cost, an error rate). */
type StatCardGoodWhen = 'up' | 'down'

type StatCardDirection = 'up' | 'down' | 'flat'

const deltaVariants = cva(
  'inline-flex items-center gap-1 text-xs tabular-nums',
  {
    variants: {
      tone: {
        good: 'text-success-foreground',
        bad: 'text-destructive',
        neutral: 'text-muted-foreground',
      },
    },
  },
)

const DIRECTION_ICON = {
  up: ArrowUpIcon,
  down: ArrowDownIcon,
  flat: MinusIcon,
} as const satisfies Record<StatCardDirection, typeof ArrowUpIcon>

const DIRECTION_WORD = {
  up: () => m.kit_stat_card_up(),
  down: () => m.kit_stat_card_down(),
  flat: () => m.kit_stat_card_flat(),
} as const satisfies Record<StatCardDirection, () => string>

/** The tone is "good" when the direction is the one the figure wants; a flat figure is neutral. */
const DIRECTION_TONE = {
  up: { up: 'good', down: 'bad' },
  down: { up: 'bad', down: 'good' },
  flat: { up: 'neutral', down: 'neutral' },
} as const satisfies Record<
  StatCardDirection,
  Record<StatCardGoodWhen, 'good' | 'bad' | 'neutral'>
>

function directionOf(value: number): StatCardDirection {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

type StatCardDeltaProps = Omit<React.ComponentProps<'p'>, 'children'> & {
  /** The change in percentage points: `12.5` is +12.5%, `-3` is -3%, `0` is no change. */
  readonly value: number
  readonly goodWhen?: StatCardGoodWhen
}

/**
 * How the number moved, from data. The direction is said three ways (arrow, signed text and the
 * `sr-only` word), never by colour alone; colour only says whether it is good (`goodWhen`).
 */
export function StatCardDelta({
  value,
  goodWhen = 'up',
  className,
  ...props
}: StatCardDeltaProps): React.JSX.Element {
  const direction = directionOf(value)
  const Direction = DIRECTION_ICON[direction]

  const text = formatNumber(value / 100, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  })

  return (
    <p
      data-slot="stat-card-delta"
      data-direction={direction}
      className={cn(
        deltaVariants({ tone: DIRECTION_TONE[direction][goodWhen] }),
        className,
      )}
      {...props}
    >
      <Direction aria-hidden="true" className="size-3 shrink-0" />
      <span className="sr-only">{DIRECTION_WORD[direction]()}</span>
      {text}
    </p>
  )
}
