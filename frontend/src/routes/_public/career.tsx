import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/head'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/career')({
  head: () =>
    pageHead({
      path: '/career',
      title: m.nav_career(),
      description: m.career_heroDescription(),
    }),
})
