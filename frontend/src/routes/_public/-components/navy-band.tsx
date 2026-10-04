import type * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ChartLineUpIcon,
  CodeIcon,
  PenNibIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

import { REVEAL, STAGGER } from './reveal'
import { PillButton } from './pill-button'
import { articles } from '#/lib/articles'
import { localized } from '#/lib/i18n'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

type Role = {
  icon: Icon
  tint: string
  title: () => string
  description: () => string
}

/**
 * O que o time faz, por ofício e não por rosto: a home apresenta engenheiros,
 * designers e analistas, e não as pessoas uma a uma.
 */
const ROLES: ReadonlyArray<Role> = [
  {
    icon: CodeIcon,
    tint: 'bg-tint-mint',
    title: () => m.home_role1Title(),
    description: () => m.home_role1Desc(),
  },
  {
    icon: PenNibIcon,
    tint: 'bg-tint-peach',
    title: () => m.home_role2Title(),
    description: () => m.home_role2Desc(),
  },
  {
    icon: ChartLineUpIcon,
    tint: 'bg-tint-lime',
    title: () => m.home_role3Title(),
    description: () => m.home_role3Desc(),
  },
]

/** A stack que a Maiyu usa, em fita. */
const STACK = [
  'React',
  'React Native',
  'Next.js',
  'AdonisJS',
  'Fastify',
  'Node.js',
  'PostgreSQL',
  'Prisma',
  'TypeScript',
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
      <div className="absolute inset-0 -z-10 [--border:rgba(49,225,247,0.12)]">
        <div className="rails size-full" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className={cn(REVEAL, 'mx-auto max-w-2xl text-center')}>
          <h2 className="text-h2">{m.home_teamTitle()}</h2>
          <span aria-hidden="true" className="brand-bar mx-auto mt-5" />
          <p className="mx-auto mt-5 max-w-[48ch] font-serif text-lead text-on-navy/75">
            {m.home_teamDesc()}
          </p>
        </div>

        <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {ROLES.map((role, index) => (
            <li
              key={index}
              className={cn(
                REVEAL,
                'flex flex-col gap-10 rounded-[1.75rem] p-7 text-foreground md:p-9',
                index === 1 && 'md:-translate-y-8',
                role.tint,
              )}
              style={{ animationDelay: `${index * STAGGER}ms` }}
            >
              <role.icon size={28} />
              <div>
                <h3 className="text-h3">{role.title()}</h3>
                <p className="mt-3 text-body text-foreground/75">
                  {role.description()}
                </p>
              </div>
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

        <div className="mt-10 flex justify-center">
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
              <p className="eyebrow">{m.nav_blog()}</p>
              <h2 className="text-h3">{m.home_notesTitle()}</h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex min-h-11 items-center text-small text-on-navy/70 underline-offset-4 hover:text-on-navy hover:underline"
            >
              {m.home_notesAll()}
            </Link>
          </div>

          <ul className="border-t border-on-navy/15">
            {articles.slice(0, JOURNAL_SIZE).map((article) => (
              <li key={article.slug} className="border-b border-on-navy/15">
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="group flex items-center justify-between gap-6 py-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-body-lg transition-opacity group-hover:opacity-75">
                      {localized(article.title)}
                    </span>
                    <span className="rounded-md bg-tint-green px-2 py-0.5 text-micro text-foreground">
                      {localized(article.readTime)}
                    </span>
                  </div>
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-green text-navy transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
                    <ArrowRightIcon size={16} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
