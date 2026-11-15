import { m } from '#/paraglide/messages'
import type { ArticleCategory, JobPosition, ProjectStatus } from '@maiyu/shared'

/**
 * The labels of each vocabulary value, in the request's language.
 *
 * Kept apart from the triplets of `projects.ts`, `jobs.ts` and `articles.ts`: there the value is an
 * identifier, here it is interface text. The difference from the siblings is that the value here is
 * a **function** and not a string: the paraglide message has to be read at render time, in the
 * language of whoever visits, and a string resolved when the module loads would freeze the language
 * of the server's first request.
 *
 * A `Record` with a closed key, so a new vocabulary value without a label here does not compile.
 */

export const JOB_POSITION_LABELS = {
  development: () => m.career_area_development(),
  design: () => m.career_area_design(),
  data: () => m.career_area_data(),
} satisfies Record<JobPosition, () => string>

export const PROJECT_STATUS_LABELS = {
  production: () => m.project_status_production(),
  validation: () => m.project_status_validation(),
} satisfies Record<ProjectStatus, () => string>

export const ARTICLE_CATEGORY_LABELS = {
  tech: () => m.blog_category_tech(),
  design: () => m.blog_category_design(),
  marketing: () => m.blog_category_marketing(),
} satisfies Record<ArticleCategory, () => string>
