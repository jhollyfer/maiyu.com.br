import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/head'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/contact')({
  head: () =>
    pageHead({
      path: '/contact',
      title: m.contactPage_metaTitle(),
      description: m.contactPage_metaDescription(),
    }),
})
