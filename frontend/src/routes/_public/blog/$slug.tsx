import { createFileRoute, notFound } from '@tanstack/react-router'

import { getArticleBySlug } from '#/lib/articles'
import { localized } from '#/lib/i18n'
import {
  breadcrumbJsonLd,
  jsonLd,
  localizedUrl,
  pageHead,
} from '#/lib/page-head'
import { PHOTOS } from '#/lib/photos'
import { SITE_TITLE, absoluteUrl } from '#/lib/site'
import { blogPostingJsonLd } from '#/lib/structured-data'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

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
          { title: `${m.blog_article_not_found()} · ${SITE_TITLE}` },
          { name: 'robots', content: 'noindex' },
        ],
      }

    const pathname = '/blog/'.concat(params.slug)
    const title = localized(loaderData.title)
    const description = localized(loaderData.excerpt)
    const image = absoluteUrl(`${PHOTOS[loaderData.photo].src}-1280.webp`)
    const head = pageHead({
      pathname,
      title,
      description,
      structuredData: [
        jsonLd(
          blogPostingJsonLd({
            title,
            description,
            url: localizedUrl(pathname, getLocale()),
            image,
            // A autoria é da Maiyu como organização, não de uma pessoa.
            author: SITE_TITLE,
            publishedAt: loaderData.date,
          }),
        ),
        breadcrumbJsonLd([
          { name: m.nav_home(), pathname: '/' },
          { name: m.nav_blog(), pathname: '/blog' },
          { name: title, pathname },
        ]),
      ],
    })

    /*
     * O `pageHead` do kit não conhece o tipo `article` nem a imagem da página: o
     * cartão do artigo leva a foto dele e `og:type: article`, e os dois entram aqui,
     * depois dele, trocando a imagem em vez de repeti-la.
     */
    return {
      ...head,
      meta: [
        ...head.meta.filter(
          (tag) => !('property' in tag) || tag.property !== 'og:image',
        ),
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: image },
      ],
    }
  },
})
