import { createFileRoute } from '@tanstack/react-router'

import { validateBlogSearch } from '#/lib/blog-search'
import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/**
 * O diário. O filtro de categoria mora na URL (`?category=design`), validado
 * por `validateBlogSearch`.
 */
export const Route = createFileRoute('/_public/blog/')({
  validateSearch: validateBlogSearch,
  head: () =>
    pageHead({
      pathname: '/blog',
      title: m.nav_blog(),
      description: m.blog_description(),
    }),
})
