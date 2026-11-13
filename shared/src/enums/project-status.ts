/**
 * Where a Maiyu project stands on the site: `production` is live with its users, `validation`
 * is still being tested with them. The label the visitor reads lives in the frontend's
 * `lib/labels.ts` (`_standards/typescript.md` §4).
 */
export const PROJECT_STATUS = {
  PRODUCTION: 'production',
  VALIDATION: 'validation',
} as const

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS]

export const PROJECT_STATUSES = Object.values(PROJECT_STATUS)
