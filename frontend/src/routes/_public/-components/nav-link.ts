import { cva } from 'class-variance-authority'

/**
 * The style of the navigation links: the desktop bar's, the phone panel's and the
 * footer's.
 *
 * It lives here, beside `header.tsx` and `footer.tsx`, as in academy: whoever uses it is this
 * shell, and `components/common/` is for what more than one area shares.
 *
 * The active link is marked by the `data-status="active"` that the router's `Link` writes by
 * itself, together with `aria-current="page"`, and not by a hand-written `pathname`
 * comparison.
 */
export const navLinkVariants = cva(
  'transition-colors duration-300 motion-reduce:transition-none',
  {
    variants: {
      tone: {
        /**
         * The desktop bar, inside the `NavigationMenu`. Half of the string is
         * replacement: the catalog link is born with height, padding and a hover
         * background, and here it is a text pill that only changes color.
         */
        bar: 'h-auto rounded-full px-4 py-2 text-small font-medium text-foreground/70 hover:bg-transparent hover:text-foreground focus:bg-transparent data-[status=active]:bg-foreground/[0.06] data-[status=active]:font-semibold data-[status=active]:text-foreground data-[status=active]:underline data-[status=active]:decoration-brand-green data-[status=active]:decoration-2 data-[status=active]:underline-offset-[6px] dark:data-[status=active]:text-brand-green',
        /**
         * The phone panel: large headings, one per line, and the green bar
         * on the active one. `min-h-11` clears WCAG 2.5.5's 44px with room to spare.
         */
        sheet:
          'group flex min-h-11 items-center justify-between border-b border-foreground/[0.08] py-5 font-display text-4xl font-bold tracking-[-0.015em] text-foreground/60 data-[status=active]:text-foreground',
        /** The footer. `min-h-11` and `min-w-11` for the same touch target: "Home" alone is under 44px wide. */
        footer:
          'inline-flex min-h-11 min-w-11 items-center gap-1 text-body text-foreground/70 hover:text-foreground',
      },
    },
    defaultVariants: {
      tone: 'footer',
    },
  },
)
