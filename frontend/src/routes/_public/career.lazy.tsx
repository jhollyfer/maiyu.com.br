import type * as React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import {
  ArrowDownIcon,
  ClockIcon,
  GraduationCapIcon,
  HouseIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

import { Card, CardContent, CardHeader } from '#/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '#/components/ui/item'
import { CareerForm } from './-components/career-form'
import { PageHero } from './-components/page-hero'
import { REVEAL, STAGGER } from './-components/reveal'
import { JOBS } from '#/lib/jobs'
import { JOB_LOCATION_LABELS, JOB_TYPE_LABELS } from '#/lib/labels'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

export const Route = createLazyFileRoute('/_public/career')({
  component: RouteComponent,
})

type Benefit = {
  icon: Icon
  tint: string
  title: () => string
  description: () => string
}

/** O que a Maiyu oferece a quem entra, cada um na sua cor. */
const BENEFITS: ReadonlyArray<Benefit> = [
  {
    icon: HouseIcon,
    tint: 'bg-tint-mint',
    title: () => m.career_benefit1Title(),
    description: () => m.career_benefit1Desc(),
  },
  {
    icon: ClockIcon,
    tint: 'bg-tint-peach',
    title: () => m.career_benefit2Title(),
    description: () => m.career_benefit2Desc(),
  },
  {
    icon: ShieldCheckIcon,
    tint: 'bg-tint-mist',
    title: () => m.career_benefit3Title(),
    description: () => m.career_benefit3Desc(),
  },
  {
    icon: GraduationCapIcon,
    tint: 'bg-tint-lime',
    title: () => m.career_benefit4Title(),
    description: () => m.career_benefit4Desc(),
  },
]

/** O alvo das vagas: o formulário, embaixo. */
const APPLY_ID = 'candidatura'

/**
 * Carreiras: o convite com o time, os benefícios, as vagas e a candidatura.
 *
 * Cada vaga é uma âncora para o formulário, e não uma página de detalhe: a
 * descrição de cada uma ainda não existe, e um link para lugar nenhum seria
 * pior que levar direto à candidatura.
 */
function RouteComponent(): React.JSX.Element {
  return (
    <>
      <PageHero title={m.career_heroTitle()} lead={m.career_heroDescription()}>
        <p
          className={cn(
            REVEAL,
            'mt-10 text-small text-foreground/80 delay-200',
          )}
        >
          {m.career_teamCount()}
        </p>
      </PageHero>

      <section data-slot="career-benefits" className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className={cn(REVEAL, 'mb-12 max-w-2xl')}>
            <h2 className="text-h2 lg:text-h1">{m.career_benefitsTitle()}</h2>
            <p className="mt-5 font-serif text-lead text-foreground/75">
              {m.career_benefitsDescription()}
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {BENEFITS.map((benefit, index) => (
              <li
                key={index}
                className={REVEAL}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <Card
                  className={cn(
                    'h-full gap-10 rounded-[1.75rem] py-7 text-body text-foreground ring-0 [--card-spacing:--spacing(7)] md:py-9 md:[--card-spacing:--spacing(9)]',
                    benefit.tint,
                  )}
                >
                  <CardHeader>
                    <benefit.icon size={24} />
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-h3">{benefit.title()}</h3>
                    <p className="mt-3 max-w-[44ch] text-body text-foreground/75">
                      {benefit.description()}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-slot="career-jobs" className="bg-surface py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-12 md:px-8">
          <div className={cn(REVEAL, 'md:col-span-4')}>
            <h2 className="text-h2 lg:text-h1">{m.career_jobsTitle()}</h2>
            <p className="mt-5 font-serif text-lead text-foreground/75">
              {m.career_jobsDescription()}
            </p>
          </div>
          <ul className="flex flex-col gap-3 md:col-span-8">
            {JOBS.map((job, index) => (
              <li
                key={job.id}
                className={REVEAL}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <Item
                  render={<a href={'#'.concat(APPLY_ID)} />}
                  className="flex-nowrap justify-between gap-6 rounded-2xl border-transparent bg-background px-6 py-5 text-base transition-colors hover:bg-tint-mint motion-reduce:transition-none"
                >
                  <ItemContent className="gap-1">
                    <ItemTitle className="line-clamp-none text-h4 font-medium">
                      {job.title()}
                    </ItemTitle>
                    <ItemDescription className="line-clamp-none text-small text-muted-foreground">
                      {JOB_LOCATION_LABELS[job.location]()},{' '}
                      {JOB_TYPE_LABELS[job.type]()}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ArrowDownIcon
                      size={18}
                      className="shrink-0 transition-transform duration-300 group-hover/item:translate-y-0.5 motion-reduce:transition-none"
                    />
                  </ItemActions>
                </Item>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id={APPLY_ID}
        data-slot="career-apply"
        className="scroll-mt-20 py-24 md:py-32"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:px-8 lg:grid-cols-12">
          <div className={cn(REVEAL, 'lg:col-span-5')}>
            <h2 className="text-h2 lg:text-h1">{m.career_formTitle()}</h2>
            <p className="mt-5 font-serif text-lead text-foreground/75">
              {m.career_formSubtitle()}
            </p>
          </div>
          <div
            className={cn(
              REVEAL,
              'rounded-[1.75rem] bg-tint-mist p-6 delay-100 md:p-10 lg:col-span-7',
            )}
          >
            <CareerForm />
          </div>
        </div>
      </section>
    </>
  )
}
