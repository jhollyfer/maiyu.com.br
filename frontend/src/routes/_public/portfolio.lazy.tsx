import type * as React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { ArrowUpRightIcon } from '@phosphor-icons/react'

import { PageHero } from './-components/page-hero'
import { REVEAL, STAGGER } from './-components/reveal'
import { PillButton } from '#/components/common/pill-button'
import { localized } from '#/lib/i18n'
import { featuredProject, projects } from '#/lib/projects'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

export const Route = createLazyFileRoute('/_public/portfolio')({
  component: RouteComponent,
})

/** Os outros projetos, sem o que já está em destaque no topo. */
const REST = projects.filter((project) => project.slug !== featuredProject.slug)

/**
 * A grade assimétrica da lista: um cartão largo e baixo, um estreito e alto e
 * deslocado para baixo, e de novo. O índice escolhe o formato por lookup, sem
 * ternário.
 */
const LAYOUTS = [
  { column: 'md:col-span-7', frame: 'aspect-[16/10] bg-tint-peach' },
  { column: 'md:col-span-5 md:mt-20', frame: 'aspect-[4/5] bg-tint-mist' },
] as const

/**
 * O portfólio: o estudo de caso em destaque e a grade com o resto.
 *
 * Cada projeto leva ao site dele, em outra aba, e não a uma página de detalhe
 * daqui: o que prova o trabalho é o produto no ar.
 */
function RouteComponent(): React.JSX.Element {
  return (
    <>
      <PageHero
        title={`${m.portfolio_heroTitle1()} ${m.portfolio_heroTitle2()} ${m.portfolio_heroTitle3()}`}
        lead={m.portfolio_heroDescription()}
      />

      <section data-slot="portfolio-featured" className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <article
            className={cn(
              REVEAL,
              'grid grid-cols-1 overflow-hidden rounded-[1.75rem] bg-tint-mint md:grid-cols-12',
            )}
          >
            <div className="relative aspect-[4/3] md:col-span-7 md:aspect-auto md:min-h-[520px]">
              <img
                src={featuredProject.image}
                alt={featuredProject.title}
                width={1863}
                height={927}
                fetchPriority="high"
                style={{ objectPosition: featuredProject.focus }}
                className="absolute inset-0 size-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-between gap-10 p-6 md:col-span-5 md:p-10">
              <div>
                <p className="text-small text-foreground/65">
                  {m.portfolio_featuredLabel()}, {featuredProject.year}
                </p>
                <h2 className="mt-2 text-h2 lg:text-h1">
                  {featuredProject.title}
                </h2>
                <p className="mt-6 font-serif text-lead leading-snug text-foreground/85">
                  {localized(featuredProject.description)}
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <ul className="flex flex-wrap gap-1.5">
                  {featuredProject.tech.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-full bg-background/60 px-3 py-1 text-micro text-foreground/80"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
                <PillButton
                  className="self-start"
                  render={
                    <a
                      href={featuredProject.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {m.portfolio_visitSite()}
                      <ArrowUpRightIcon />
                    </a>
                  }
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section data-slot="portfolio-list" className="bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className={cn(REVEAL, 'mb-12 max-w-2xl text-h1')}>
            {m.home_selectedWorkDesc()}
          </h2>

          <ul className="grid grid-cols-1 gap-10 md:grid-cols-12">
            {REST.map((project, index) => {
              const layout = LAYOUTS[index % LAYOUTS.length]

              return (
                <li
                  key={project.slug}
                  className={cn(REVEAL, layout.column)}
                  style={{ animationDelay: `${index * STAGGER}ms` }}
                >
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div
                      className={cn(
                        'overflow-hidden rounded-[1.75rem]',
                        layout.frame,
                      )}
                    >
                      <img
                        src={project.image}
                        alt={project.title}
                        width={1863}
                        height={927}
                        loading="lazy"
                        decoding="async"
                        style={{ objectPosition: project.focus }}
                        className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    </div>
                    <div className="mt-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-small text-muted-foreground">
                          {project.year}, {localized(project.client)}
                        </p>
                        <h3 className="mt-2 text-h2">{project.title}</h3>
                        <p className="mt-3 max-w-lg text-body text-foreground/75">
                          {localized(project.summary)}
                        </p>
                      </div>
                      <ArrowUpRightIcon
                        size={20}
                        className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                      />
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
