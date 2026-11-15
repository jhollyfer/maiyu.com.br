import type {
  ConfigExtension,
  DefaultClassGroupIds,
  DefaultThemeGroupIds,
} from 'tailwind-merge'

/**
 * The project's class tokens for `cn` (KIT.md §3.4): what `styles.css` adds to the Tailwind
 * scale (`text-display`, `min-h-hero`...) has to be told to `twMerge`, or `cn('text-inverse',
 * 'text-display')` drops the color as if both were sizes. It is the project's file: the sync
 * creates this empty skeleton when it is missing and never overwrites it.
 * _doc-lib/tailwind-merge.md, `extendTailwindMerge`.
 *
 * Why the site scale is here: `tailwind-merge` treats any unknown `text-<name>` as a color, so
 * `cn('text-primary-foreground', 'text-small')` erased the color and the primary button ended up
 * navy on navy in the light theme (a defect that went live). Declaring the sizes of the `@theme`
 * of `styles.css` lets the size and color groups coexist.
 */
export const PROJECT_CLASS_MERGE = {
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
} satisfies ConfigExtension<DefaultClassGroupIds, DefaultThemeGroupIds>
