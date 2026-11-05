import type * as React from 'react'
import { ArrowUpRightIcon } from '@phosphor-icons/react'

import { REVEAL, STAGGER } from './reveal'
import { PillButton } from './pill-button'
import { Badge } from '#/components/ui/badge'
import { localized } from '#/lib/i18n'
import { projects } from '#/lib/projects'
import type { Project } from '#/lib/projects'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

type ProjectProps = {
  project: Project
}

/** A stack do projeto em etiquetas, no máximo três: o resto está no portfólio. */
function Stack({ project }: ProjectProps): React.JSX.Element {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {project.tech.slice(0, 3).map((tech) => (
        <Badge
          key={tech}
          render={<li />}
          variant="secondary"
          className="h-auto px-3 py-1 text-micro font-normal"
        >
          {tech}
        </Badge>
      ))}
    </ul>
  )
}

/** O botão de visitar, igual no destaque e nas linhas. */
function Visit({ project }: ProjectProps): React.JSX.Element {
  return (
    <PillButton
      tone="outline"
      className="rounded-xl"
      render={
        <a href={project.url} target="_blank" rel="noopener noreferrer">
          {m.home_workVisit()}
          <ArrowUpRightIcon />
        </a>
      }
    />
  )
}

/**
 * A captura de tela do projeto, com a moldura fina.
 *
 * `width` e `height` reais do arquivo para o navegador reservar o espaço antes
 * de baixar, e `object-position` do registro para a manchete do print não sair
 * do recorte.
 */
function Shot({
  project,
  className,
}: ProjectProps & { className?: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-secondary',
        className,
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
        className="aspect-[2/1] size-full object-cover"
      />
    </div>
  )
}

/**
 * "Já em produção": um projeto em destaque, grande, e os demais em lista com
 * fios.
 *
 * Substitui o carrossel: no carrossel só um projeto aparecia por vez, e a prova
 * de que a Maiyu entrega precisa estar toda à vista. O primeiro do registro é
 * o destaque; a ordem do registro é a ordem na tela.
 */
export function Work(): React.JSX.Element {
  const [lead, ...rest] = projects

  return (
    <section data-slot="home-work" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className={cn(REVEAL, 'max-w-3xl text-display')}>
          {m.home_workTitle()}
        </h2>

        <article
          className={cn(
            REVEAL,
            'mt-14 grid gap-8 delay-100 md:grid-cols-12 md:gap-12',
          )}
        >
          <Shot project={lead} className="md:order-2 md:col-span-7" />
          <div className="flex flex-col justify-between gap-8 md:col-span-5">
            <div>
              <h3 className="text-h1">{lead.title}</h3>
              <p className="mt-5 max-w-[48ch] font-serif text-body-lg text-foreground/80">
                {localized(lead.description)}
              </p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <Stack project={lead} />
              <Visit project={lead} />
            </div>
          </div>
        </article>

        <ul className="mt-16 divide-y divide-border border-y border-border">
          {rest.map((project, index) => (
            <li
              key={project.slug}
              className={cn(
                REVEAL,
                'grid gap-6 py-8 md:grid-cols-12 md:items-center md:gap-10',
              )}
              style={{ animationDelay: `${index * STAGGER}ms` }}
            >
              <Shot project={project} className="md:col-span-3" />
              <div className="md:col-span-6">
                <h3 className="text-h3">{project.title}</h3>
                <p className="mt-3 max-w-[56ch] font-serif text-body-lg text-foreground/80">
                  {localized(project.summary)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-4 md:col-span-3">
                <Stack project={project} />
                <Visit project={project} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
