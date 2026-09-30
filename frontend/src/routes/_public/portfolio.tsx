import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/head'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/portfolio')({
  head: () =>
    pageHead({
      path: '/portfolio',
      title: m.nav_portfolio(),
      description: m.portfolio_heroDescription(),
    }),
})
