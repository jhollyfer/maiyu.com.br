import { createFileRoute, notFound } from '@tanstack/react-router'

import { getArticleBySlug } from '#/lib/articles'
import { pageHead } from '#/lib/head'
import { localized, localizedUrl } from '#/lib/i18n'
import { PHOTOS } from '#/lib/photos'
import { SITE_TITLE, absoluteUrl } from '#/lib/site'
import {
  blogPostingJsonLd,
  breadcrumbListJsonLd,
  jsonLdScript,
} from '#/lib/structured-data'
import { m } from '#/paraglide/messages'

/**
 * Um artigo do diário.
 *
 * O `loader` procura o artigo e lança `notFound()` quando o slug não existe,
 * que é o 404 de negócio do padrão: a rota desenha o seu `notFoundComponent`
 * (no `.lazy.tsx`) em vez de uma página vazia com status de sucesso.
 */
export const Route = createFileRoute('/_public/blog/$slug')({
  loader: ({ params }) => {
    const article = getArticleBySlug(params.slug)
    if (!article) throw notFound()

    return article
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return {
        meta: [
          { title: `${m.blogArticle_notFound()} · ${SITE_TITLE}` },
          { name: 'robots', content: 'noindex' },
        ],
      }

    const path = '/blog/'.concat(params.slug)
    const title = localized(loaderData.title)
    const description = localized(loaderData.excerpt)
    const image = absoluteUrl(`${PHOTOS[loaderData.photo].src}-1280.webp`)

    return {
      ...pageHead({
        path,
        title,
        description,
        image,
        type: 'article',
      }),
      scripts: [
        jsonLdScript(
          blogPostingJsonLd({
            title,
            description,
            url: localizedUrl(path),
            image,
            // A autoria é da Maiyu como organização, não de uma pessoa.
            author: SITE_TITLE,
            publishedAt: loaderData.date,
          }),
        ),
        ...breadcrumbListJsonLd(
          { name: m.nav_home(), url: localizedUrl('/') },
          [
            { name: m.nav_blog(), url: localizedUrl('/blog') },
            { name: title, url: localizedUrl(path) },
          ],
        ).map(jsonLdScript),
      ],
    }
  },
})
