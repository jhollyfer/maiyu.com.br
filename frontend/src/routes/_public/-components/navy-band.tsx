import type * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react'

import { REVEAL, STAGGER } from './reveal'
import { PillButton } from './pill-button'
import { Badge } from '#/components/ui/badge'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from '#/components/ui/item'
import { articles } from '#/lib/articles'
import { localized } from '#/lib/i18n'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

type Role = {
  title: () => string
  description: () => string
}

/**
 * O que o time faz, por ofício e não por rosto: a home apresenta engenheiros,
 * designers e analistas, e não as pessoas uma a uma.
 */
const ROLES: ReadonlyArray<Role> = [
  {
    title: () => m.home_role1Title(),
    description: () => m.home_role1Desc(),
  },
  {
    title: () => m.home_role2Title(),
    description: () => m.home_role2Desc(),
  },
  {
    title: () => m.home_role3Title(),
    description: () => m.home_role3Desc(),
  },
]

/** A stack que a Maiyu usa, em fita. */
const STACK = [
  'React',
  'React Native',
  'TanStack Start',
  'AdonisJS',
  'Fastify',
  'Node.js',
  'PostgreSQL',
  'TypeScript',
  'Tailwind CSS',
  'Figma',
]

/** Quantas entradas do diário a home mostra. */
const JOURNAL_SIZE = 4

/**
 * A faixa navy: o time, a stack, o convite de carreira e o diário.
 *
 * Um bloco escuro só para as quatro coisas, e é decisão como a do academy com
 * os blocos de marca: uma cor de assinatura que aparece em toda seção deixa de
 * assinar. Aqui ela marca a parte da home que fala de gente.
 */
export function NavyBand(): React.JSX.Element {
  return (
    <section
      data-slot="home-navy-band"
      className="relative isolate overflow-hidden bg-navy py-24 text-on-navy md:py-32"
    >
      <div
        aria-hidden="true"
        className="trancado absolute inset-x-0 top-0 opacity-90"
      />
      <div
        aria-hidden="true"
        className="trancado absolute inset-x-0 bottom-0 opacity-90"
      />
      <div className="absolute inset-0 -z-10 [--border:rgba(49,225,247,0.12)]">
        <div className="rails size-full" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className={cn(REVEAL, 'max-w-4xl')}>
          <h2 className="text-display tracking-[-0.015em]">
            {m.home_teamTitle()}
          </h2>
          <p className="mt-6 max-w-[56ch] font-serif text-lead text-on-navy/80">
            {m.home_teamDesc()}
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-10 border-t border-on-navy/15 pt-10 md:grid-cols-3 md:gap-12">
          {ROLES.map((role, index) => (
            <li
              key={index}
              className={cn(REVEAL)}
              style={{ animationDelay: `${index * STAGGER}ms` }}
            >
              <h3 className="text-h3">{role.title()}</h3>
              <p className="mt-3 max-w-[36ch] font-serif text-body-lg text-on-navy/75">
                {role.description()}
              </p>
            </li>
          ))}
        </ul>

        <div
          aria-hidden="true"
          className="mt-16 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
        >
          <ul className="marquee flex w-max gap-14 pr-14">
            {[...STACK, ...STACK].map((name, index) => (
              <li
                key={index}
                className="font-display text-h4 font-medium tracking-[-0.02em] text-on-navy/45"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex">
          <PillButton
            tone="neon"
            className="rounded-xl"
            render={
              <Link to="/career">
                {m.nav_career()}
                <ArrowUpRightIcon />
              </Link>
            }
          />
        </div>

        <div className="mt-28 md:mt-36">
          <div
            className={cn(
              REVEAL,
              'mb-8 flex flex-wrap items-end justify-between gap-6',
            )}
          >
            <div>
              <h2 className="text-h1">{m.home_notesTitle()}</h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex min-h-11 items-center text-small text-on-navy/70 underline-offset-4 hover:text-on-navy hover:underline"
            >
              {m.home_notesAll()}
            </Link>
          </div>

          <ItemGroup className="gap-0 border-t border-on-navy/15">
            {articles.slice(0, JOURNAL_SIZE).map((article) => (
              <Item
                key={article.slug}
                render={<li />}
                className="rounded-none border-0 border-b border-on-navy/15 p-0 text-body"
              >
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="group flex w-full items-center justify-between gap-6 py-5"
                >
                  <ItemContent className="flex-row flex-wrap items-center gap-3">
                    <ItemTitle className="line-clamp-none text-body-lg transition-opacity group-hover:opacity-75">
                      {localized(article.title)}
                    </ItemTitle>
                    <Badge
                      variant="secondary"
                      className="h-auto rounded-md bg-tint-green px-2 py-0.5 text-micro font-normal text-foreground"
                    >
                      {localized(article.readTime)}
                    </Badge>
                  </ItemContent>
                  <ItemActions>
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-green text-navy transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
                      <ArrowRightIcon size={16} />
                    </span>
                  </ItemActions>
                </Link>
              </Item>
            ))}
          </ItemGroup>
        </div>
      </div>
    </section>
  )
}
