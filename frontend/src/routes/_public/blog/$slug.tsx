import { createFileRoute, notFound } from '@tanstack/react-router'

import { getArticleBySlug } from '#/lib/articles'
import { localized, localizedUrl } from '#/lib/i18n'
import { breadcrumbJsonLd, jsonLd, pageHead } from '#/lib/page-head'
import { PHOTOS } from '#/lib/photos'
import { SITE_TITLE, absoluteUrl } from '#/lib/site'
import { blogPostingJsonLd } from '#/lib/structured-data'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

/**
 * A journal article.
 *
 * The `loader` looks for the article and throws `notFound()` when the slug does not exist,
 * which is the pattern's business 404: the route draws its `notFoundComponent`
 * (in the `.lazy.tsx`) instead of an empty page with a success status.
 */
export const Route = createFileRoute('/_public/blog/$slug')({
  loader: ({ params }) => {
    const article = getArticleBySlug(params.slug)
    if (!article) throw notFound()

    return article
  },
  head: ({ loaderData, params }) => {
    const pathname = '/blog/'.concat(params.slug)
    if (!loaderData)
      return pageHead({
        pathname,
        title: m.blog_article_not_found(),
        noindex: true,
      })

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
            // Authorship belongs to Maiyu as an organization, not to a person.
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
     * The kit's `pageHead` does not know the `article` type or the page image: the
     * article card carries its own photo and `og:type: article`, and both go in here,
     * after it, replacing the image instead of repeating it.
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
