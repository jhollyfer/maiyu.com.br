import { ArrowDownIcon } from '@phosphor-icons/react'
import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { TALENT_AREAS } from '#/lib/jobs'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

import { ChannelsNotice } from './-components/channels-notice'
import { PageHero } from './-components/page-hero'
import { Photo } from './-components/photo'
import { REVEAL, STAGGER } from './-components/reveal'

export const Route = createLazyFileRoute('/_public/career')({
  component: RouteComponent,
})

type Principle = {
  title: () => string
  description: () => string
}

/**
 * Como a Maiyu trabalha. Cada princípio é verificável no próprio site: o time
 * da região, as três línguas, os projetos no ar. Nada aqui promete benefício
 * que a empresa não possa mostrar.
 */
const PRINCIPLES: ReadonlyArray<Principle> = [
  {
    title: () => m.career_principle1_title(),
    description: () => m.career_principle1_desc(),
  },
  {
    title: () => m.career_principle2_title(),
    description: () => m.career_principle2_desc(),
  },
  {
    title: () => m.career_principle3_title(),
    description: () => m.career_principle3_desc(),
  },
  {
    title: () => m.career_principle4_title(),
    description: () => m.career_principle4_desc(),
  },
]

/** O alvo das áreas: o aviso com os canais, embaixo. */
const APPLY_ID = 'contato'

/**
 * Carreiras: o banco de talentos.
 *
 * Não há vaga aberta para listar, então a página convida por área. Cada área é
 * uma âncora para os canais de contato, e não uma página de detalhe: não existe
 * descrição de cargo, e um link para lugar nenhum seria pior que levar direto
 * a quem responde. Não há formulário de candidatura (`docs/DECISIONS.md` #17).
 */
function RouteComponent(): React.JSX.Element {
  return (
    <>
      <PageHero
        title={m.career_hero_title()}
        lead={m.career_hero_description()}
      />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Photo
          name="river"
          ratio={2}
          sizes="(min-width: 1280px) 1216px, 100vw"
        />
      </div>

      <section data-slot="career-areas" className="py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-12 md:px-8">
          <div className="md:col-span-4">
            <h2 className="text-h2 lg:text-h1">{m.career_areas_title()}</h2>
            <p className="mt-5 max-w-[62ch] text-body-lg text-foreground/75">
              {m.career_areas_description()}
            </p>
          </div>
          <ul className="divide-y divide-border border-y border-border md:col-span-8">
            {TALENT_AREAS.map((area, index) => (
              <li
                key={area.id}
                className={REVEAL}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <a
                  href={'#'.concat(APPLY_ID)}
                  className="group flex items-start justify-between gap-6 py-7 transition-colors hover:text-urucum motion-reduce:transition-none"
                >
                  <span className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="mt-3 size-2 shrink-0 rotate-45 bg-urucum"
                    />
                    <span>
                      <h3 className="text-h3">{area.title()}</h3>
                      <span className="mt-2 block max-w-[52ch] text-body text-muted-foreground">
                        {area.description()}
                      </span>
                    </span>
                  </span>
                  <ArrowDownIcon
                    aria-hidden="true"
                    size={20}
                    className="mt-2 shrink-0 transition-transform duration-300 group-hover:translate-y-0.5 motion-reduce:transition-none"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-slot="career-welcome" className="pb-24 md:pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-12 md:px-8">
          <h2 className="text-h1 text-balance md:col-span-7">
            {m.career_welcome_title()}
          </h2>
          <p className="max-w-[62ch] text-body-lg text-foreground/80 md:col-span-5 md:self-end">
            {m.career_welcome_body()}
          </p>
        </div>
      </section>

      <section
        data-slot="career-principles"
        className="bg-navy py-24 text-on-navy md:py-32"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-12 md:px-8">
          <h2 className="text-h2 lg:text-h1 md:col-span-4">
            {m.career_principles_title()}
          </h2>
          <ul className="divide-y divide-on-navy/20 border-y border-on-navy/20 md:col-span-8">
            {PRINCIPLES.map((principle, index) => (
              <li
                key={index}
                className={cn(REVEAL, 'flex items-start gap-4 py-7')}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="mt-3 size-2 shrink-0 rotate-45 bg-urucum"
                />
                <div>
                  <h3 className="text-h3">{principle.title()}</h3>
                  <p className="mt-2 max-w-[56ch] text-body text-on-navy/80">
                    {principle.description()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div aria-hidden="true" className="trancado" />

      <section
        id={APPLY_ID}
        data-slot="career-apply"
        className="scroll-mt-20 py-24 md:py-32"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-h2 lg:text-h1">{m.career_contact_title()}</h2>
            <p className="mt-5 max-w-[62ch] text-body-lg text-foreground/75">
              {m.career_contact_subtitle()}
            </p>
          </div>
          <div className="lg:col-span-7">
            <ChannelsNotice />
          </div>
        </div>
      </section>
    </>
  )
}
