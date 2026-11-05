import type * as React from 'react'
import { Link, createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { ArrowRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react'

import { Photo } from '../-components/photo'
import { PillButton } from '../-components/pill-button'
import { REVEAL } from '../-components/reveal'
import {
  NotFoundPage,
  NotFoundPageActions,
  NotFoundPageHomeButton,
  NotFoundPageTitle,
} from '#/components/common/not-found-page'
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
import type { ArticleBlock } from '#/lib/articles'
import { localized, localizedDate } from '#/lib/i18n'
import { ARTICLE_CATEGORY_LABELS } from '#/lib/labels'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

const route = getRouteApi('/_public/blog/$slug')

export const Route = createLazyFileRoute('/_public/blog/$slug')({
  component: RouteComponent,
  notFoundComponent: ArticleNotFound,
})

/**
 * O artigo que não existe.
 *
 * Separado do 404 genérico, como o post do academy: quem chega aqui quase
 * sempre veio de um link para um texto que saiu do ar, e o que precisa saber
 * é que **há** outros textos, não que errou o endereço.
 */
function ArticleNotFound(): React.JSX.Element {
  return (
    <NotFoundPage className="min-h-[80dvh]">
      <NotFoundPageTitle>{m.blogArticle_notFound()}</NotFoundPageTitle>
      <NotFoundPageActions>
        <NotFoundPageHomeButton to="/blog">
          {m.blogArticle_returnToJournal()}
        </NotFoundPageHomeButton>
      </NotFoundPageActions>
    </NotFoundPage>
  )
}

/**
 * Como cada tipo de bloco se desenha, por lookup e não por `if`.
 *
 * Parágrafo com `leading-[1.75]` e corpo grande: a medida vem do `max-w`
 * do artigo, não de cada linha. O intertítulo leva o losango de urucum como
 * marcador de capítulo e mais espaço acima do que abaixo, para que ele
 * pertença ao parágrafo que abre, e não ao que fecha.
 */
const BLOCKS: Record<
  ArticleBlock['kind'],
  (text: string, key: string) => React.JSX.Element
> = {
  heading: (text, key) => (
    <div key={key} className="mt-16 mb-5">
      <span
        aria-hidden="true"
        className="mb-5 block size-2 rotate-45 bg-urucum"
      />
      <h2 className="text-h2 text-balance">{text}</h2>
    </div>
  ),
  paragraph: (text, key) => (
    <p
      key={key}
      className="mb-7 text-body-lg leading-[1.75] text-foreground/85"
    >
      {text}
    </p>
  ),
}

/**
 * Um artigo do diário, inteiro: capa, foto de lugar com crédito e
 * o corpo numa coluna de leitura.
 *
 * O corpo vem de `articles.ts` já nas três línguas, bloco a bloco. Quando o
 * volume pedir markdown, ele passa a sair do `react-markdown`, como o
 * `RichText` do academy.
 */
function RouteComponent(): React.JSX.Element {
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
                  className="inline-flex min-h-11 items-center"
                >
                  {m.nav_home()}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to="/blog" />}
                  className="inline-flex min-h-11 items-center"
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
              <AvatarImage
                src="/maiyu-symbol.svg"
                alt=""
                className="object-contain p-2"
              />
            </Avatar>
            <p className="text-small text-muted-foreground">
              <span className="block text-body font-medium text-foreground">
                {m.blogArticle_author()}
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
        {article.body.map((block, index) =>
          BLOCKS[block.kind](localized(block.text), `${index}`),
        )}
      </article>

      <span
        aria-hidden="true"
        className="trancado mx-auto block w-full max-w-7xl"
      />

      <section data-slot="article-more" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h2 className="text-h2">{m.blogArticle_moreTitle()}</h2>
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
            <h2 className="text-h1 text-balance">{m.blogArticle_ctaTitle()}</h2>
            <p className="mt-4 max-w-[40ch] font-serif text-lead text-foreground/80">
              {m.blogArticle_ctaDescription()}
            </p>
          </div>
          <PillButton
            render={
              <Link to="/contact">
                {m.nav_getInTouch()}
                <ArrowUpRightIcon />
              </Link>
            }
          />
        </div>
      </section>
    </>
  )
}
