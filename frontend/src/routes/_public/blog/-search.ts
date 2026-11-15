import { listValidateSearch } from '#/lib/list-search'
import { ARTICLE_CATEGORIES, z } from '@maiyu/shared'

/**
 * The journal filter, in the URL (`?category=design`).
 *
 * In the URL and not in `useState`, like the panel's listings: the chosen filter
 * survives a reload, coming back from the article and a shared link. Without
 * `category`, it is "all".
 *
 * Only this route reads the search, so the module lives beside it (`frontend.md` §1,
 * `-search.ts`) and `validateSearch` is never inline in `createFileRoute`. The
 * schema is the `z` from `shared/` and the factory is the kit's: a value outside the list (an
 * old or mistyped link) is discarded and falls back to "all", like the official page's
 * `.catch()`, instead of bringing the page down.
 * _doc-lib/tanstack-router.md#how-to/validate-search-params,
 * https://tanstack.com/router/latest/docs/how-to/validate-search-params.
 */
const blogSearchSchema = z.object({
  category: z.enum(ARTICLE_CATEGORIES).optional(),
})

export type BlogSearch = z.output<typeof blogSearchSchema>

export const validateSearch = listValidateSearch(blogSearchSchema)
