import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge, mergeConfigs } from 'tailwind-merge'

import { PROJECT_CLASS_MERGE } from './cn-project'

/**
 * `twMerge` with the house scale (`frontend.md` §6, "Tokens e tema"): without
 * it, `z-modal` and `text-error-code` would not be recognized as members of the
 * `z-index` and `font-size` groups, and `cn('z-modal', 'z-tooltip')` would keep
 * both. The names are those in `styles.css`; the project's own go in `cn-project.ts`.
 */
const twMerge = extendTailwindMerge(
  {
    extend: {
      classGroups: {
        z: [
          { z: ['sticky', 'overlay', 'modal', 'dropdown', 'toast', 'tooltip'] },
        ],
        'font-size': [
          {
            text: [
              'caption',
              'error-code',
              'error-code-lg',
              'lead',
              'body',
              'supporting',
              'title',
            ],
          },
        ],
        leading: [{ leading: ['display'] }],
      },
    },
  },
  (config) => mergeConfigs(config, PROJECT_CLASS_MERGE),
)

export function cn(...inputs: ReadonlyArray<ClassValue>): string {
  return twMerge(clsx(inputs))
}
