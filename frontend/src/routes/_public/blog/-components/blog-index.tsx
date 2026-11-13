import { ArrowRightIcon } from '@phosphor-icons/react'
import { Link, getRouteApi } from '@tanstack/react-router'
import type * as React from 'react'

import { Badge } from '#/components/ui/badge'
import { articles, featuredArticle } from '#/lib/articles'
import { cn } from '#/lib/cn'
import { localized } from '#/lib/i18n'
import { ARTICLE_CATEGORY_LABELS } from '#/lib/labels'
import { localizedDate } from '#/lib/site-i18n'
import { m } from '#/paraglide/messages'
import { ARTICLE_CATEGORIES } from '@maiyu/shared'
import type { ArticleCategory } from '@maiyu/shared'

import { PageHero } from '../../-components/page-hero'
import { Photo } from '../../-components/photo'
import { REVEAL, STAGGER } from '../../-components/reveal'

const route = getRouteApi('/_public/blog/')

/** The list entries: all, except the one already featured at the top. */
const RECENT = articles.filter(
  (article) => article.slug !== featuredArticle.slug,
)

/** A filter option: `undefined` is "all". */
const FILTERS: ReadonlyArray<{
  category: ArticleCategory | undefined
  label: () => string
}> = [
  { category: undefined, label: () => m.blog_category_all() },
  ...ARTICLE_CATEGORIES.map((category) => ({
    category,
    label: ARTICLE_CATEGORY_LABELS[category],
  })),
]

/**
 * The journal: the featured text with the photo of a place and the filterable list in
 * ruled rows. The newsletter box is gone: there was no email service
 * behind it, and it promised an email that never arrived.
 *
 * The filter is a `Link` and not a button with state: the category lives in the URL, so the
 * filter survives a reload and coming back from the article, and is shareable.
 * `resetScroll={false}` because changing category is not changing page, and
 * jumping to the top would take the list away from whoever just filtered.
 *
 * The list carries no photo: the journal is read by title, and identical thumbnails
 * would compete with the featured photo, which is what carries the place. `Photo`
 * also brings a credit link, so it cannot live inside another link.
 */
export function BlogIndex(): React.JSX.Element {
  const { category } = route.useSearch()

  const filtered = RECENT.filter(
    (article) => !category || article.category === category,
  )

  return (
    <>
      <PageHero title={m.blog_title()} lead={m.blog_description()} />

      <section data-slot="blog-featured" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-12">
            <div className={cn(REVEAL, 'md:col-span-7')}>
              <Photo
                name={featuredArticle.photo}
                ratio={3 / 2}
                sizes="(min-width: 1280px) 700px, (min-width: 768px) 55vw, 100vw"
                priority
              />
            </div>
            <div
              className={cn(
                REVEAL,
                'flex flex-col gap-6 delay-200 md:col-span-5',
              )}
            >
              <p className="flex items-center gap-3 text-small text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-2 rotate-45 bg-urucum"
                />
                {ARTICLE_CATEGORY_LABELS[featuredArticle.category]()}
                <time dateTime={featuredArticle.date}>
                  {localizedDate(featuredArticle.date)}
                </time>
              </p>
              <h2 className="text-h1 text-balance">
                <Link
                  to="/blog/$slug"
                  params={{ slug: featuredArticle.slug }}
                  className="underline-offset-8 hover:underline"
                >
                  {localized(featuredArticle.title)}
                </Link>
              </h2>
              <p className="max-w-[46ch] font-serif text-lead leading-snug text-foreground/85">
                {localized(featuredArticle.excerpt)}
              </p>
              <Link
                to="/blog/$slug"
                params={{ slug: featuredArticle.slug }}
                className="group inline-flex min-h-11 items-center gap-2 self-start text-body font-medium text-urucum"
              >
                {m.blog_read_article()}
                <ArrowRightIcon
                  size={18}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section data-slot="blog-list" className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-6 border-t border-border pt-12 md:flex-row md:items-end md:justify-between">
            <h2 className="text-h1">{m.blog_recent_articles()}</h2>
            <nav
              aria-label={m.blog_recent_articles()}
              className="flex flex-wrap gap-2"
            >
              {FILTERS.map((filter) => {
                const active = filter.category === category

                /*
                  `min-h-11` on every width: a Badge is not covered by the `ui/` touch
                  patch (#461), and the chip keeps 44px on the desktop as well, so the
                  layout does not move between widths.
                */
                return (
                  <Badge
                    key={String(filter.category)}
                    variant="outline"
                    data-active={active}
                    render={
                      <Link
                        to="/blog"
                        search={{ category: filter.category }}
                        resetScroll={false}
                        aria-current={active}
                      />
                    }
                    className="h-auto min-h-11 border-foreground/20 bg-transparent px-4 py-0 text-small font-medium text-foreground/70 transition-colors duration-300 hover:border-foreground/45 hover:text-foreground data-[active=true]:border-foreground data-[active=true]:bg-foreground data-[active=true]:text-background dark:data-[active=true]:bg-foreground motion-reduce:transition-none"
                  >
                    {filter.label()}
                  </Badge>
                )
              })}
            </nav>
          </div>

          {/*
            `key` on the category: changing the filter remounts the list, and the remount
            redoes the cascading entrance, as `StaggerContainer` did.
          */}
          <ul key={String(category)} className="mt-8 divide-y divide-border">
            {filtered.map((article, index) => (
              <li
                key={article.slug}
                className={REVEAL}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="group grid grid-cols-1 gap-x-12 gap-y-3 py-10 md:grid-cols-12"
                >
                  <p className="text-small text-muted-foreground md:col-span-3">
                    {ARTICLE_CATEGORY_LABELS[article.category]()}
                    <span className="mt-1 block">
                      <time dateTime={article.date}>
                        {localizedDate(article.date)}
                      </time>
                      {', '}
                      {localized(article.readTime)}
                    </span>
                  </p>
                  <div className="md:col-span-8">
                    <h3 className="font-serif text-h3 leading-tight text-balance underline-offset-4 group-hover:underline">
                      {localized(article.title)}
                    </h3>
                    <p className="mt-3 max-w-[62ch] text-body text-foreground/70">
                      {localized(article.excerpt)}
                    </p>
                  </div>
                  <ArrowRightIcon
                    size={20}
                    aria-hidden="true"
                    className="hidden justify-self-end text-urucum transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none md:col-span-1 md:block"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
