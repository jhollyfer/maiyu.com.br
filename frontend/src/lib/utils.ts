import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The `twMerge` with the site's text scale.
 *
 * A divergence from academy, and for a defect that went live: `tailwind-merge` does not know the
 * sizes defined in the `@theme` of `styles.css` (`text-small`, `text-body`, `text-h2`...) and
 * treats any unknown `text-<name>` as a **color**. The pill joins `text-primary-foreground` with
 * `text-small`, and the merge erased the color thinking they were two colors: the primary button
 * ended up navy on navy in the light theme. Declaring the scale here lets both groups coexist.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        '2xs',
        'micro',
        'small',
        'body',
        'body-lg',
        'lead',
        'h4',
        'h3',
        'h2',
        'h1',
        'display',
        'display-xl',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
