import type * as React from 'react'
import { Link, createLazyFileRoute, getRouteApi } from '@tanstack/react-router'

import { FIELD } from '../-components/form-style'
import { PageHero } from '../-components/page-hero'
import { REVEAL, STAGGER } from '../-components/reveal'
import { PillButton } from '../-components/pill-button'
import { AspectRatio } from '#/components/ui/aspect-ratio'
import { Avatar, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Card } from '#/components/ui/card'
import { Field, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { articles, featuredArticle } from '#/lib/articles'
import { ARTICLE_CATEGORIES } from '#/lib/entity'
import type { ArticleCategory } from '#/lib/entity'
import { localized } from '#/lib/i18n'
import { ARTICLE_CATEGORY_LABELS } from '#/lib/labels'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

const route = getRouteApi('/_public/blog/')

export const Route = createLazyFileRoute('/_public/blog/')({
  component: RouteComponent,
})

/** A cor de cada cartão da grade, em rodízio. */
const TINTS = ['bg-tint-mint', 'bg-tint-peach', 'bg-tint-mist']

/** As entradas da grade: todas, menos a que já está em destaque no topo. */
const RECENT = articles.filter(
  (article) => article.slug !== featuredArticle.slug,
)

/** Uma opção do filtro: `undefined` é "tudo". */
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
 * O diário: o artigo em destaque, a grade filtrável e a newsletter.
 *
 * O filtro é `Link` e não botão com estado: a categoria mora na URL, então o
 * filtro sobrevive ao recarregar e ao voltar do artigo, e é compartilhável.
 * `resetScroll={false}` porque trocar de categoria não é trocar de página, e
 * pular para o topo tiraria a grade da frente de quem acabou de filtrar.
 */
function RouteComponent(): React.JSX.Element {
  const { category } = route.useSearch()

  const filtered = RECENT.filter(
    (article) => !category || article.category === category,
  )

  return (
    <>
      <PageHero title={m.blog_title()} lead={m.blog_description()} />

      <section data-slot="blog-featured" className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Link
            to="/blog/$slug"
            params={{ slug: featuredArticle.slug }}
            className="group block"
          >
            <Card
              className={cn(
                REVEAL,
                'grid grid-cols-1 gap-0 rounded-[1.75rem] bg-tint-lime py-0 text-base ring-0 md:grid-cols-12',
              )}
            >
              <AspectRatio
                ratio={4 / 3}
                className="overflow-hidden md:col-span-7 md:aspect-auto md:min-h-[480px]"
              >
                <img
                  src={featuredArticle.image}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </AspectRatio>
              <div className="flex flex-col justify-between gap-10 p-6 md:col-span-5 md:p-10">
                <div>
                  <p className="text-small text-foreground/65">
                    {m.blog_featured()},{' '}
                    {ARTICLE_CATEGORY_LABELS[featuredArticle.category]()}
                  </p>
                  <h2 className="mt-3 text-h2">
                    {localized(featuredArticle.title)}
                  </h2>
                  <p className="mt-5 font-serif text-lead leading-snug text-foreground/85">
                    {localized(featuredArticle.excerpt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={featuredArticle.authorImg} alt="" />
                  </Avatar>
                  <div>
                    <p className="text-small font-medium">
                      {featuredArticle.author}
                    </p>
                    <p className="text-micro text-foreground/70">
                      {localized(featuredArticle.role)},{' '}
                      {localized(featuredArticle.readTime)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      <section data-slot="blog-list" className="bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="text-h1">{m.blog_recentArticles()}</h2>
            <nav
              aria-label={m.blog_recentArticles()}
              className="flex flex-wrap gap-2"
            >
              {FILTERS.map((filter) => {
                const active = filter.category === category

                return (
                  <Badge
                    key={filter.category ?? 'all'}
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
                    className="h-auto min-h-11 border-foreground/20 bg-transparent px-4 py-0 text-small font-medium text-foreground/70 transition-colors duration-300 hover:border-foreground/45 hover:text-foreground data-[active=true]:border-foreground data-[active=true]:bg-foreground data-[active=true]:text-background motion-reduce:transition-none"
                  >
                    {filter.label()}
                  </Badge>
                )
              })}
            </nav>
          </div>

          {/*
            `key` na categoria: trocar o filtro remonta a grade, e a remontagem
            refaz a entrada em cascata, como o `StaggerContainer` fazia.
          */}
          <ul
            key={category ?? 'all'}
            className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((article, index) => (
              <li
                key={article.slug}
                className={REVEAL}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="group block"
                >
                  <AspectRatio
                    ratio={16 / 11}
                    className={cn(
                      'overflow-hidden rounded-[1.5rem]',
                      TINTS[index % TINTS.length],
                    )}
                  >
                    <img
                      src={article.image}
                      alt=""
                      width={640}
                      height={440}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] motion-reduce:transition-none"
                    />
                  </AspectRatio>
                  <p className="mt-5 text-small text-muted-foreground">
                    {ARTICLE_CATEGORY_LABELS[article.category]()},{' '}
                    {localized(article.readTime)}
                  </p>
                  <h3 className="mt-2 text-h4 font-medium transition-opacity group-hover:opacity-75">
                    {localized(article.title)}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-body text-foreground/70">
                    {localized(article.excerpt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Newsletter />
    </>
  )
}

/**
 * A caixa da newsletter.
 *
 * **Não inscreve ninguém**, e é o comportamento do site no ar: não há serviço
 * de e-mail por trás, e o envio só é contido para a página não recarregar. O
 * campo usa a validação nativa (`required`, `type="email"`), como o formulário
 * de contato do adacaibs, porque não há payload para um validator cuidar.
 */
function Newsletter(): React.JSX.Element {
  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
  }

  return (
    <section data-slot="blog-newsletter" className="py-24 md:py-32">
      <div className={cn(REVEAL, 'mx-auto max-w-7xl px-4 md:px-8')}>
        <div className="flex flex-col items-center rounded-[1.75rem] bg-tint-mist px-6 py-16 text-center md:py-20">
          <h2 className="text-h1">{m.blog_newsletterTitle()}</h2>
          <p className="mt-5 max-w-[44ch] font-serif text-lead text-foreground/80">
            {m.blog_newsletterDesc()}
          </p>
          <form
            method="post"
            onSubmit={submit}
            className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <Field className="flex-1">
              <FieldLabel htmlFor="newsletter-email" className="sr-only">
                {m.contactPage_emailLabel()}
              </FieldLabel>
              <Input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                placeholder={m.blog_emailPlaceholder()}
                className={cn(
                  FIELD,
                  'rounded-full border-foreground/25 bg-background/70 px-5 placeholder:text-foreground/55',
                )}
              />
            </Field>
            <PillButton type="submit">{m.blog_subscribe()}</PillButton>
          </form>
        </div>
      </div>
    </section>
  )
}
