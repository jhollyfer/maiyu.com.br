/**
 * Where a contact message stands for the team: `pending` has no answer yet, `answered` was
 * marked by the owner. The listing filter reads these two; the row itself only keeps
 * `answered_at`, so the status is derived and never stored (`DECISIONS.md`, contato).
 */
export const CONTACT_STATUS = {
  PENDING: 'pending',
  ANSWERED: 'answered',
} as const

export type ContactStatus = (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS]

export const CONTACT_STATUSES = Object.values(CONTACT_STATUS)
