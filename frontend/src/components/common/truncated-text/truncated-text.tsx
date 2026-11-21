import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { useIsOverflowing } from '#/hooks/use-is-overflowing'
import { cn } from '#/lib/cn'

/**
 * `lines` is how many lines the text may take before the browser cuts it with an ellipsis. The
 * classes are whole strings so Tailwind sees them (`line-clamp-*` cannot be built from a number).
 */
const truncatedTextVariants = cva('block min-w-0 break-words', {
  variants: {
    lines: {
      1: 'line-clamp-1',
      2: 'line-clamp-2',
      3: 'line-clamp-3',
      4: 'line-clamp-4',
    },
  },
  defaultVariants: { lines: 1 },
})

type TruncatedTextProps = Omit<React.ComponentProps<'span'>, 'children'> &
  VariantProps<typeof truncatedTextVariants> & {
    /** The whole text. The cut is CSS, so this string stays whole in the DOM and in the reader. */
    readonly value: string
  }

/**
 * A text that is cut by the browser (`line-clamp`, CSS) and not by counting characters, so it
 * follows the width of its column at 375px and at 1280px alike, and a reader gets the whole string.
 *
 * Only the text the browser actually cut gets a way to read the rest: a button (so the keyboard
 * reaches it and a touch can press it) that opens the full text in a tooltip on hover and focus and
 * expands the text in place on press, `aria-expanded` saying which. A text that fits is a plain
 * `<span>`, with no tab stop. The tooltip is the sighted keyboard and mouse copy; the doc is
 * explicit that it is not reliable on touch or for a screen reader, which is why the press expands
 * the text too (_doc-lib/base-ui.md#react/components/tooltip,
 * https://base-ui.com/react/components/tooltip.md, "Accessibility").
 * `DECISIONS.md` #822.
 */
export function TruncatedText({
  value,
  lines,
  className,
  ...props
}: TruncatedTextProps): React.JSX.Element {
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  const [expanded, setExpanded] = React.useState(false)
  const overflowing = useIsOverflowing(node)

  const text = (
    <span
      ref={setNode}
      data-slot="truncated-text"
      data-truncated={overflowing}
      className={cn(
        truncatedTextVariants({ lines }),
        expanded && 'line-clamp-none',
        className,
      )}
      {...props}
    >
      {value}
    </span>
  )

  // Expanded the text no longer overflows, and the button must stay to collapse it again.
  if (!overflowing && !expanded) return text

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
            className="h-auto min-w-0 flex-col items-start justify-start p-0 text-left text-[length:inherit] leading-[inherit] font-normal whitespace-normal hover:bg-transparent sm:h-auto"
          />
        }
      >
        {text}
      </TooltipTrigger>
      <TooltipContent className="max-w-sm whitespace-normal text-left">
        {value}
      </TooltipContent>
    </Tooltip>
  )
}
