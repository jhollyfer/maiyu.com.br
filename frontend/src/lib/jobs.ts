import { m } from '#/paraglide/messages'

import { JOB_POSITION_LABELS } from './labels'

/**
 * The talent pool's areas, listed on the careers page.
 *
 * The home of this triplet is `shared/src/enums/` (`_standards/typescript.md` §4). It stays here only
 * until the kit's batch 10A sync: the export goes through `shared/src/index.ts`, which 10A changes,
 * and the `shared/` session is the one that moves it. After that this file imports the triplet from
 * `@maiyu/shared`.
 */
export const JOB_POSITION = {
  DEVELOPMENT: 'development',
  DESIGN: 'design',
  DATA: 'data',
} as const

export type JobPosition = (typeof JOB_POSITION)[keyof typeof JOB_POSITION]

export const JOB_POSITIONS = Object.values(JOB_POSITION)

/**
 * The talent pool's areas, on the careers page.
 *
 * Maiyu does not publish job openings: it keeps the contact of whoever works in each area and calls
 * when a project asks for it. Listing a role and a benefit the company does not offer would be
 * inventing what the site promises, so the registry describes only the craft.
 *
 * Content in code, like `projects.ts`: there is no panel or API. The text is a function for the
 * reason given in `labels.ts`, read at render time, in the language of whoever visits. The `id` is
 * the closed value of `JobPosition`, and the label comes from `labels.ts`.
 */
export type TalentArea = {
  id: JobPosition
  title: () => string
  description: () => string
}

export const TALENT_AREAS: ReadonlyArray<TalentArea> = [
  {
    id: 'development',
    title: JOB_POSITION_LABELS.development,
    description: () => m.career_area_development_desc(),
  },
  {
    id: 'design',
    title: JOB_POSITION_LABELS.design,
    description: () => m.career_area_design_desc(),
  },
  {
    id: 'data',
    title: JOB_POSITION_LABELS.data,
    description: () => m.career_area_data_desc(),
  },
]
