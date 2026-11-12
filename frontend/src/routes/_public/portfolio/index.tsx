import { createFileRoute } from '@tanstack/react-router'

import { localized } from '#/lib/i18n'
import { jsonLd, pageHead } from '#/lib/page-head'
import { projects } from '#/lib/projects'
import { absoluteUrl } from '#/lib/site'
import { projectListJsonLd } from '#/lib/structured-data'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/portfolio/')({
  head: () =>
    pageHead({
      pathname: '/portfolio',
      title: m.nav_portfolio(),
      description: m.portfolio_hero_description(),
      structuredData: [
        jsonLd(
          projectListJsonLd(
            projects.map((project) => ({
              name: project.title,
              description: localized(project.summary),
              url: project.url,
              image: absoluteUrl(project.image),
              dateCreated: project.year,
            })),
          ),
        ),
      ],
    }),
})
