import type * as React from 'react'
import { Link, createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { ArrowRightIcon } from '@phosphor-icons/react'

import { FIELD } from '../-components/form-style'
import { PageHero } from '../-components/page-hero'
import { Photo } from '../-components/photo'
import { PillButton } from '../-components/pill-button'
import { REVEAL, STAGGER } from '../-components/reveal'
import { Badge } from '#/components/ui/badge'
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

/** As entradas da lista: todas, menos a que já está em destaque no topo. */
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
 * O diário: o texto em destaque com a foto de lugar, a lista filtrável em
 * fileiras com fio e a newsletter.
 *
 * O filtro é `Link` e não botão com estado: a categoria mora na URL, então o
 * filtro sobrevive ao recarregar e ao voltar do artigo, e é compartilhável.
 * `resetScroll={false}` porque trocar de categoria não é trocar de página, e
 * pular para o topo tiraria a lista da frente de quem acabou de filtrar.
 *
 * A lista não leva foto: o diário se lê pelo título, e miniaturas iguais
 * competiriam com a foto do destaque, que é quem carrega o lugar. A `Photo`
 * também traz um link de crédito, então não pode morar dentro de outro link.
 */
function RouteComponent(): React.JSX.Element {
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
                  {featuredArticle.date}
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
                {m.blog_readArticle()}
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
            `key` na categoria: trocar o filtro remonta a lista, e a remontagem
            refaz a entrada em cascata, como o `StaggerContainer` fazia.
          */}
          <ul key={category ?? 'all'} className="mt-8 divide-y divide-border">
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
                      <time dateTime={article.date}>{article.date}</time>
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
    <section
      data-slot="blog-newsletter"
      className="bg-secondary py-24 md:py-32"
    >
      <div className={cn(REVEAL, 'mx-auto max-w-7xl px-4 md:px-8')}>
        <div className="flex flex-col items-center px-6 text-center">
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
