import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

import { validateSearch } from './-search'

/**
 * O diário. O filtro de categoria mora na URL (`?category=design`), validado
 * por `validateSearch`, de `-search.ts`.
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
