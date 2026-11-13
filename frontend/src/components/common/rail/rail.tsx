import type * as React from 'react'

import { cn } from '#/lib/cn'
import type { Merge } from '@maiyu/shared'

/** `ol` where the order counts (steps in time), `ul` where it does not. */
const RAIL_LIST = {
  ordered: 'ol',
  unordered: 'ul',
} as const satisfies Record<string, 'ol' | 'ul'>

type RailProps = Merge<
  Omit<React.ComponentProps<'ul'>, 'aria-label' | 'tabIndex' | 'ref'>,
  {
    /** The list's name for a screen reader, by `m.*()`: the rail takes focus, so it needs one. */
    readonly label: string
    readonly list?: keyof typeof RAIL_LIST
    /** The `li` of the rail. */
    readonly children: React.ReactNode
  }
>

/**
 * A side-scrolling rail (`@utility rail` of `styles.css`): the list scrolls sideways on a phone and
 * the caller turns it into a grid from the breakpoint it wants (`md:grid md:grid-cols-5
 * md:overflow-visible`), by container (`@2xl:`) when the piece may sit in a narrow column
 * (`frontend.md` §10.4).
 *
 * What scrolls has to take focus: with nothing focusable inside, the keyboard cannot reach the scroll
 * (axe `scrollable-region-focusable`; WCAG 2.1.1 and 2.1.3;
 * https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable). So the list itself gets
 * `tabIndex={0}` and its name by `aria-label`, with the theme's `focus-ring`. No `role="region"`: the
 * list role stays, and a screen reader announces the list and its items.
 *
 * The `label` names the list, not the section around it: a container that already carries the same
 * name (a `<section aria-label>` or a heading the section points to) makes the reader say it twice, so
 * the rail gets its own name ("Itens do tema") or the container drops its label. The tab stop stays
 * when the caller turns the list into a grid that no longer scrolls: one extra stop on wide screens is
 * the accepted cost, because removing it would mean measuring the overflow in JavaScript on every
 * resize.
 *
 * The rule is charged, not trusted: `responsive.spec.ts` runs `ResponsiveAudit.repeatedNames` on every
 * page of the project and fails when a list, region or landmark has the name of its labelled container.
 */
export function Rail({
  label,
  list = 'unordered',
  className,
  children,
  ...props
}: RailProps): React.JSX.Element {
  const List = RAIL_LIST[list]

  return (
    <List
      {...props}
      data-slot="rail"
      tabIndex={0}
      aria-label={label}
      className={cn('rail focus-ring', className)}
    >
      {children}
    </List>
  )
}
