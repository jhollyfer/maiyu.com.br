import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/**
 * The home. No `loader`: no section reads an API, and the content lives in `lib/`.
 *
 * The title carries what the company does and where, and not "Home": whoever searches
 * "custom software" or "Benjamin Constant" lands here, and the brand already comes
 * at the end of the title.
 */
export const Route = createFileRoute('/_public/')({
  head: () =>
    pageHead({
      pathname: '/',
      title: m.meta_home_title(),
      description: m.site_description(),
    }),
})
