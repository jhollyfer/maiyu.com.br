import { ArrowUpRightIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { Picture } from '#/components/common/picture/picture'
import { Badge } from '#/components/ui/badge'
import { localized } from '#/lib/i18n'
import { projects } from '#/lib/projects'
import type { Project } from '#/lib/projects'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import type { Merge } from '@maiyu/shared'

import { PillButton } from '../pill-button'
import { ProjectStatusBadge } from '../project-status'
import { REVEAL, STAGGER } from '../reveal'

type ProjectProps = {
  project: Project
}

/** The project's stack as labels, three at most: the rest is in the portfolio. */
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

/** The visit button, the same in the featured one and in the rows. */
function Visit({ project }: ProjectProps): React.JSX.Element {
  return (
    <PillButton
      tone="outline"
      className="rounded-xl"
      render={
        <a href={project.url} target="_blank" rel="noopener noreferrer">
          {m.home_work_visit()}
          <ArrowUpRightIcon />
        </a>
      }
    />
  )
}

/**
 * The project's screenshot, with the thin frame.
 *
 * The file's real `width` and `height` so the browser reserves the space before
 * downloading, and the registry's `object-position` so the screenshot's headline does not leave
 * the crop.
 */
function Shot({
  project,
  className,
}: Merge<ProjectProps, { className?: string }>): React.JSX.Element {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-secondary',
        className,
      )}
    >
      <Picture
        src={project.image}
        alt={project.title}
        width={1863}
        height={927}
        placement="fold"
        style={{ objectPosition: project.focus }}
        className="aspect-[2/1] size-full object-cover"
      />
    </div>
  )
}

/**
 * "Already in production": one featured project, large, and the others in a list with
 * lines.
 *
 * It replaces the carousel: in the carousel only one project appeared at a time, and the proof
 * that Maiyu delivers needs to be fully in view. The first in the registry is
 * the featured one; the registry's order is the order on screen.
 */
export function Work(): React.JSX.Element {
  const [lead, ...rest] = projects

  return (
    <section data-slot="home-work" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className={cn(REVEAL, 'max-w-3xl text-display')}>
          {m.home_work_title()}
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
              <ProjectStatusBadge status={lead.status} />
              <h3 className="mt-4 text-h1">{lead.title}</h3>
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
                <ProjectStatusBadge status={project.status} />
                <h3 className="mt-3 text-h3">{project.title}</h3>
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
