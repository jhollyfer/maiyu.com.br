import { ArrowRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react'
import { Link, getRouteApi } from '@tanstack/react-router'
import type * as React from 'react'

import logo from '#/assets/brand/logo.svg'
import { RichText } from '#/components/common/rich-text/rich-text'
import {
  NotFoundPage,
  NotFoundPageActions,
  NotFoundPageHomeButton,
  NotFoundPageTitle,
} from '#/components/common/route-status/not-found-page'
import { Avatar, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { articles } from '#/lib/articles'
import { localized } from '#/lib/i18n'
import { ARTICLE_CATEGORY_LABELS } from '#/lib/labels'
import { localizedDate } from '#/lib/site-i18n'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

import { Photo } from '../../-components/photo'
import { PillButton } from '../../-components/pill-button'
import { REVEAL } from '../../-components/reveal'

const route = getRouteApi('/_public/blog/$slug')

/**
 * The article that does not exist.
 *
 * Separate from the generic 404, like academy's post: whoever arrives here almost
 * always came from a link to a text that was taken down, and what they need to know
 * is that there **are** other texts, not that they mistyped the address.
 */
export function ArticleNotFound(): React.JSX.Element {
  return (
    <NotFoundPage className="min-h-[80dvh]">
      <NotFoundPageTitle>{m.blog_article_not_found()}</NotFoundPageTitle>
      <NotFoundPageActions>
        <NotFoundPageHomeButton to="/blog">
          {m.blog_article_return_to_journal()}
        </NotFoundPageHomeButton>
      </NotFoundPageActions>
    </NotFoundPage>
  )
}

/**
 * The body typography, by class over the `RichText` `prose`: the measure comes from the article's
 * `max-w`, and not from each line. The subheading carries the annatto diamond as a chapter marker
 * and more space above than below, so that it belongs to the paragraph it opens, and not to the
 * one it closes.
 */
const BODY_CLASS = cn(
  'prose-lg',
  'prose-p:mb-7 prose-p:text-body-lg prose-p:leading-[1.75]',
  // The color comes through the prose variable: `text-body-lg` and `text-foreground/85` in the same list
  // are treated as a conflict by `RichText`'s `twMerge`, which erases the size.
  '[--tw-prose-body:color-mix(in_oklab,var(--foreground)_85%,transparent)]',
  'prose-h2:mt-16 prose-h2:mb-5 prose-h2:text-h2 prose-h2:text-balance',
  "prose-h2:before:mb-5 prose-h2:before:block prose-h2:before:size-2 prose-h2:before:rotate-45 prose-h2:before:bg-urucum prose-h2:before:content-['']",
)

/**
 * A whole journal article: cover, photo of a place with credit and
 * the body in a reading column.
 *
 * The body comes from `articles.ts` as a Tiptap document in the three languages and goes out
 * through the kit's `RichText`, which draws it on the server: the article's text is
 * in the response HTML.
 */
export function Article(): React.JSX.Element {
  const article = route.useLoaderData()
  const more = articles
    .filter((other) => other.slug !== article.slug)
    .slice(0, 2)

  return (
    <>
      <header data-slot="article-header" className="pt-32 md:pt-40">
        <div className={cn(REVEAL, 'mx-auto max-w-4xl px-4 md:px-8')}>
          <Breadcrumb>
            <BreadcrumbList className="text-small">
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to="/" />}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center"
                >
                  {m.nav_home()}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to="/blog" />}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center"
                >
                  {m.nav_blog()}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="block max-w-[28ch] truncate sm:max-w-[48ch]">
                  {localized(article.title)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="mt-10 text-h1 leading-[1.02] tracking-[-0.015em] text-balance">
            {localized(article.title)}
          </h1>
          <p className="mt-8 max-w-[52ch] font-serif text-lead leading-snug text-foreground/80">
            {localized(article.excerpt)}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-6">
            <Avatar className="size-10 bg-secondary">
              <AvatarImage src={logo} alt="" className="object-contain p-2" />
            </Avatar>
            <p className="text-small text-muted-foreground">
              <span className="block text-body font-medium text-foreground">
                {m.blog_article_author()}
              </span>
              <time dateTime={article.date}>{localizedDate(article.date)}</time>
              {', '}
              {localized(article.readTime)}
            </p>
            <Badge
              variant="outline"
              className="ml-auto h-auto px-3 py-1 text-micro"
            >
              {ARTICLE_CATEGORY_LABELS[article.category]()}
            </Badge>
          </div>
        </div>
      </header>

      <div
        className={cn(REVEAL, 'mx-auto mt-12 max-w-6xl px-4 delay-200 md:px-8')}
      >
        <Photo
          name={article.photo}
          ratio={21 / 10}
          sizes="(min-width: 1152px) 1100px, 100vw"
          priority
        />
      </div>

      <article
        data-slot="article-body"
        className="mx-auto max-w-[44rem] px-4 pt-16 pb-24 md:px-8 md:pt-24"
      >
        <RichText content={localized(article.body)} className={BODY_CLASS} />
      </article>

      <span
        aria-hidden="true"
        className="trancado mx-auto block w-full max-w-7xl"
      />

      <section data-slot="article-more" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h2 className="text-h2">{m.blog_article_more_title()}</h2>
          <ul className="mt-8 divide-y divide-border border-y border-border">
            {more.map((other) => (
              <li key={other.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: other.slug }}
                  className="group flex items-center justify-between gap-6 py-6"
                >
                  <span className="font-serif text-h4 leading-snug text-balance underline-offset-4 group-hover:underline">
                    {localized(other.title)}
                  </span>
                  <ArrowRightIcon
                    size={20}
                    aria-hidden="true"
                    className="shrink-0 text-urucum transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-slot="article-cta" className="bg-secondary py-20 md:py-28">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-8 px-4 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <h2 className="text-h1 text-balance">
              {m.blog_article_cta_title()}
            </h2>
            <p className="mt-4 max-w-[40ch] font-serif text-lead text-foreground/80">
              {m.blog_article_cta_description()}
            </p>
          </div>
          <PillButton
            render={
              <Link to="/contact">
                {m.nav_get_in_touch()}
                <ArrowUpRightIcon />
              </Link>
            }
          />
        </div>
      </section>
    </>
  )
}
