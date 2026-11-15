/**
 * The areas a person can work in at Maiyu, as the careers page groups them. The label the
 * visitor reads lives in the frontend's `lib/labels.ts` (`_standards/typescript.md` §4).
 */
export const JOB_POSITION = {
  DEVELOPMENT: 'development',
  DESIGN: 'design',
  DATA: 'data',
} as const

export type JobPosition = (typeof JOB_POSITION)[keyof typeof JOB_POSITION]

export const JOB_POSITIONS = Object.values(JOB_POSITION)
