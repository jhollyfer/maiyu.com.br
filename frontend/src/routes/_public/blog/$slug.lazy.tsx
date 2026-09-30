import type * as React from 'react'
import { Link, createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { ArrowLeftIcon, ArrowUpRightIcon } from '@phosphor-icons/react'

import { REVEAL } from '../-components/reveal'
import {
  NotFoundPage,
  NotFoundPageActions,
  NotFoundPageHomeButton,
  NotFoundPageTitle,
} from '#/components/common/not-found-page'
import { PillButton } from '#/components/common/pill-button'
import { SkyBackdrop } from '#/components/common/sky'
import { localized } from '#/lib/i18n'
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

/** O intertítulo e o parágrafo do corpo, com a medida de leitura do site no ar. */
const HEADING = 'mt-16 mb-5 text-h2'
const PARAGRAPH = 'mb-8 text-body-lg leading-[1.75] text-foreground/85'

/** Os três tópicos da primeira seção. */
const BULLETS = [
  () => m.blogArticle_bullet1(),
  () => m.blogArticle_bullet2(),
  () => m.blogArticle_bullet3(),
]

/**
 * Um artigo do diário, inteiro.
 *
 * O corpo é o texto único que o site no ar mostra em todo artigo: o conteúdo
 * de cada um ainda não foi escrito, e o cabeçalho (título, resumo, autor) é o
 * que muda de um para outro. Quando os textos existirem, o corpo passa a sair
 * de markdown pelo `react-markdown`, como o `RichText` do academy.
 */
function RouteComponent(): React.JSX.Element {
  const article = route.useLoaderData()

  return (
    <>
      <header
        data-slot="article-header"
        className="relative overflow-hidden pt-32 pb-16 md:pt-40"
      >
        <SkyBackdrop />
        <div className={cn(REVEAL, 'relative mx-auto max-w-3xl px-4 md:px-8')}>
          <Link
            to="/blog"
            className="group inline-flex min-h-11 items-center gap-2 text-small text-foreground/70 transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon
              size={14}
              className="transition-transform duration-300 group-hover:-translate-x-0.5 motion-reduce:transition-none"
            />
            {m.blogArticle_backToJournal()}
          </Link>
          <p className="mt-10 text-small text-foreground/70">
            {ARTICLE_CATEGORY_LABELS[article.category]()},{' '}
            <time dateTime={article.date}>{article.date}</time>
          </p>
          <h1 className="mt-4 text-h1 md:text-display">
            {localized(article.title)}
          </h1>
          <p className="mt-8 font-serif text-lead leading-snug text-foreground/80">
            {localized(article.excerpt)}
          </p>
          <div className="mt-10 flex items-center gap-4">
            <img
              src={article.authorImg}
              alt=""
              className="size-11 rounded-full object-cover"
            />
            <div>
              <p className="text-body font-medium">{article.author}</p>
              <p className="text-small text-foreground/70">
                {localized(article.role)}, {localized(article.readTime)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div
          className={cn(
            REVEAL,
            'overflow-hidden rounded-[1.75rem] bg-tint-mist delay-200 zoom-in-95 duration-1000',
          )}
        >
          <img
            src={article.image}
            alt=""
            fetchPriority="high"
            className="aspect-[16/9] w-full object-cover md:aspect-[21/10]"
          />
        </div>
      </div>

      <article className="mx-auto max-w-2xl px-4 py-20 md:px-8 md:py-28">
        <p className={PARAGRAPH}>{m.blogArticle_introText()}</p>

        <h2 className={HEADING}>{m.blogArticle_section1Title()}</h2>
        <p className={PARAGRAPH}>{m.blogArticle_section1Text()}</p>
        <ul className="mb-12 list-disc space-y-3 pl-5 text-body text-foreground/85 marker:text-foreground/40">
          {BULLETS.map((bullet, index) => (
            <li key={index}>{bullet()}</li>
          ))}
        </ul>

        <h2 className={HEADING}>{m.blogArticle_section2Title()}</h2>
        <p className={PARAGRAPH}>{m.blogArticle_section2Text()}</p>

        <blockquote className="my-16 rounded-[1.5rem] bg-tint-peach p-8 md:p-10">
          <p className="font-serif text-h3 leading-snug italic">
            “{m.blogArticle_quote()}”
          </p>
        </blockquote>

        <h2 className={HEADING}>{m.blogArticle_section3Title()}</h2>
        <p className={PARAGRAPH}>{m.blogArticle_section3Text()}</p>
      </article>

      <section data-slot="article-cta" className="pb-24 md:pb-32">
        <div className={cn(REVEAL, 'mx-auto max-w-5xl px-4 md:px-8')}>
          <div className="flex flex-col items-start gap-8 rounded-[1.75rem] bg-tint-mint p-8 md:flex-row md:items-end md:justify-between md:p-14">
            <div>
              <h2 className="text-h1">{m.blogArticle_ctaTitle()}</h2>
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
        </div>
      </section>
    </>
  )
}
