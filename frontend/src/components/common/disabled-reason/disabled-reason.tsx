import * as React from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/cn'

type DisabledReasonProps = Readonly<{
  /** Why the control is unavailable; absent, empty or `false` draws only the child. */
  reason?: string | false | null
  /** The control itself: one element that takes `className`, `onClick` and `aria-*` (a `Button`). */
  children: React.ReactElement<React.ComponentProps<'button'>>
}>

/**
 * The reason a control is unavailable, which the keyboard and the screen reader reach.
 *
 * The control is **its own trigger**: it gets `aria-disabled` (not `disabled`, which would take
 * it out of the tab order and out of reach of focus and hover), `aria-describedby` pointing to the
 * reason written as text, and a click that does nothing, so a `type="submit"` does not submit.
 * No wrapper with a role: the button stays the only interactive element, with its own name.
 *
 * The tooltip is only the visual copy of the reason for sighted mouse and keyboard users; the doc is
 * explicit that it is not accessible to touch or screen readers and does not replace the
 * description (`_doc-lib/base-ui.md#react/components/tooltip`,
 * https://base-ui.com/react/components/tooltip.md, "Accessibility"). The `sr-only` text is what is
 * announced.
 *
 * With no `reason` the control is drawn as it came: no extra attribute, no tab stop.
 */
export function DisabledReason({
  reason,
  children,
}: DisabledReasonProps): React.JSX.Element {
  const reasonId = React.useId()

  if (!reason) return <>{children}</>

  const trigger = React.cloneElement(children, {
    'aria-disabled': true,
    'aria-describedby': reasonId,
    className: cn(children.props.className, 'opacity-50'),
    onClick: (event) => event.preventDefault(),
  })

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={trigger} />
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
      <span id={reasonId} data-slot="disabled-reason" className="sr-only">
        {reason}
      </span>
    </>
  )
}
