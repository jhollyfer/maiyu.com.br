import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/career')({
  head: () =>
    pageHead({
      pathname: '/career',
      title: m.career_metaTitle(),
      description: m.career_metaDescription(),
    }),
})
