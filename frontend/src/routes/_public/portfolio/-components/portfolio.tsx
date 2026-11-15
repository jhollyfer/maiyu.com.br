import { ArrowUpRightIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { Picture } from '#/components/common/picture/picture'
import { AspectRatio } from '#/components/ui/aspect-ratio'
import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/cn'
import { localized } from '#/lib/i18n'
import { featuredProject, projects } from '#/lib/projects'
import type { Project } from '#/lib/projects'
import { m } from '#/paraglide/messages'

import { PageHero } from '../../-components/page-hero'
import { pillVariants } from '../../-components/pill-button'
import { ProjectStatusBadge } from '../../-components/project-status'
import { REVEAL, STAGGER } from '../../-components/reveal'

/** The other projects, without the one already featured at the top. */
const REST = projects.filter((project) => project.slug !== featuredProject.slug)

type ProjectProps = {
  project: Project
}

/** The screenshot of the live site, in the print's proportion, with a border line. */
function ProjectShot({ project }: ProjectProps): React.JSX.Element {
  return (
    <AspectRatio
      ratio={1863 / 927}
      className="overflow-hidden rounded-xl bg-secondary ring-1 ring-border"
    >
      <Picture
        src={project.image}
        alt={project.title}
        width={1863}
        height={927}
        placement="fold"
        style={{ objectPosition: project.focus }}
        className="size-full object-cover"
      />
    </AspectRatio>
  )
}

/** Year and technologies: the sheet that goes with every project. */
function ProjectFacts({ project }: ProjectProps): React.JSX.Element {
  return (
    <dl className="grid grid-cols-[5.5rem_1fr] gap-x-6 gap-y-4 border-t border-border pt-6 text-small">
      <dt className="text-muted-foreground">{m.portfolio_year_label()}</dt>
      <dd className="flex items-center gap-2">
        <span aria-hidden="true" className="size-2 rotate-45 bg-urucum" />
        {project.year}
      </dd>
      <dt className="text-muted-foreground">{m.portfolio_stack_label()}</dt>
      <dd>
        <ul className="flex flex-wrap gap-1.5">
          {project.tech.map((tech) => (
            <li key={tech}>
              <Badge
                variant="outline"
                className="h-auto px-2.5 py-1 text-micro"
              >
                {tech}
              </Badge>
            </li>
          ))}
        </ul>
      </dd>
    </dl>
  )
}

/** The link to the live site, which opens in another tab. */
function VisitLink({ project }: ProjectProps): React.JSX.Element {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(pillVariants({}), 'self-start')}
    >
      {m.portfolio_visit_site()}
      <ArrowUpRightIcon />
      <span className="sr-only">{project.title}</span>
    </a>
  )
}

/**
 * The portfolio: the featured product, large, and the others in ruled rows.
 *
 * Each project leads to its own site, in another tab, and not to a detail page
 * here: what proves the work is the live product. That is why the screenshot comes
 * whole, without a card crop, and the text is a list and typography.
 */
export function Portfolio(): React.JSX.Element {
  return (
    <>
      <PageHero
        title={`${m.portfolio_hero_title1()} ${m.portfolio_hero_title2()} ${m.portfolio_hero_title3()}`}
        lead={m.portfolio_hero_description()}
      />

      <section data-slot="portfolio-featured" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <article>
            <div className={cn(REVEAL, 'zoom-in-95 duration-1000')}>
              <AspectRatio
                ratio={1863 / 927}
                className="overflow-hidden rounded-xl bg-secondary ring-1 ring-border"
              >
                <Picture
                  src={featuredProject.image}
                  alt={featuredProject.title}
                  width={1863}
                  height={927}
                  placement="lcp"
                  style={{ objectPosition: featuredProject.focus }}
                  className="size-full object-cover"
                />
              </AspectRatio>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-12">
              <div className="md:col-span-5">
                <ProjectStatusBadge status={featuredProject.status} />
                <h2
                  className={cn(
                    REVEAL,
                    'mt-4 text-display leading-none delay-200',
                  )}
                >
                  {featuredProject.title}
                </h2>
              </div>
              <div
                className={cn(
                  REVEAL,
                  'flex flex-col gap-8 delay-300 md:col-span-7',
                )}
              >
                <p className="max-w-[62ch] font-serif text-lead leading-snug text-foreground/85">
                  {localized(featuredProject.description)}
                </p>
                <ProjectFacts project={featuredProject} />
                <VisitLink project={featuredProject} />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section data-slot="portfolio-list" className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="max-w-2xl border-t border-border pt-12 text-h1">
            {m.home_selected_work_desc()}
          </h2>

          <ul className="mt-6 divide-y divide-border">
            {/*
             * The screenshot's side alternates per row: the alternation breaks the straight column of images
             * on the left and gives the magazine rhythm. It is `group-even/row:` in CSS, and not a lookup by
             * index: `SIDES[index % 2]` was typed `undefined` with `noUncheckedIndexedAccess`. On the
             * phone the order is always the source's: image, text.
             */}
            {REST.map((project, index) => {
              return (
                <li
                  key={project.slug}
                  className={cn(
                    REVEAL,
                    'group/row grid grid-cols-1 items-center gap-x-12 gap-y-8 py-14 md:grid-cols-12 md:py-20',
                  )}
                  style={{ animationDelay: `${index * STAGGER}ms` }}
                >
                  <div className="md:col-span-7 md:group-even/row:order-2">
                    <ProjectShot project={project} />
                  </div>
                  <div className="flex flex-col gap-6 md:col-span-5 md:group-even/row:order-1">
                    <ProjectStatusBadge
                      status={project.status}
                      className="self-start"
                    />
                    <h2 className="text-h1 leading-none">{project.title}</h2>
                    <p className="font-serif text-lead leading-snug text-foreground/85">
                      {localized(project.summary)}
                    </p>
                    <p className="max-w-[62ch] text-body text-foreground/75">
                      {localized(project.description)}
                    </p>
                    <ProjectFacts project={project} />
                    <VisitLink project={project} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
