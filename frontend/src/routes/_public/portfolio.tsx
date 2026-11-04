import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/head'
import { localized } from '#/lib/i18n'
import { projects } from '#/lib/projects'
import { absoluteUrl } from '#/lib/site'
import { jsonLdScript, projectListJsonLd } from '#/lib/structured-data'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/portfolio')({
  head: () => ({
    ...pageHead({
      path: '/portfolio',
      title: m.nav_portfolio(),
      description: m.portfolio_heroDescription(),
    }),
    scripts: [
      jsonLdScript(
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
