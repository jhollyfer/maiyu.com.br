import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

import { validateSearch } from './-search'

/**
 * The journal. The category filter lives in the URL (`?category=design`), validated
 * by `validateSearch`, from `-search.ts`.
 */
export const Route = createFileRoute('/_public/blog/')({
  validateSearch,
  head: () =>
    pageHead({
      pathname: '/blog',
      title: m.nav_blog(),
      description: m.blog_description(),
    }),
})
