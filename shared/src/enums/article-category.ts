/**
 * The category of a journal article, the cut of the blog listing. The label the visitor reads
 * lives in the frontend's `lib/labels.ts` (`_standards/typescript.md` §4).
 */
export const ARTICLE_CATEGORY = {
  TECH: 'tech',
  DESIGN: 'design',
  MARKETING: 'marketing',
} as const

export type ArticleCategory =
  (typeof ARTICLE_CATEGORY)[keyof typeof ARTICLE_CATEGORY]

export const ARTICLE_CATEGORIES = Object.values(ARTICLE_CATEGORY)
