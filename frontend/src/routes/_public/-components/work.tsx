import * as React from 'react'
import { ArrowUpRightIcon } from '@phosphor-icons/react'

import { REVEAL } from './reveal'
import { PillButton } from './pill-button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '#/components/ui/carousel'
import type { CarouselApi } from '#/components/ui/carousel'
import { localized } from '#/lib/i18n'
import { projects } from '#/lib/projects'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/**
 * A cor de cada cartão, em rodízio. Três e não uma por projeto: a lista cresce
 * sem que alguém precise escolher cor para o próximo.
 */
const CARD_TINTS = ['bg-tint-peach-soft', 'bg-tint-mint', 'bg-tint-mist']

/** Os nomes em fita, repetidos até cobrir uma tela larga duas vezes. */
const MARQUEE = [...projects, ...projects, ...projects, ...projects]

/** O número com dois dígitos, como no contador `01 / 03`. */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * "Já em produção": a fita com os nomes e o carrossel dos projetos.
 *
 * O `Carousel` do registry, e não o cartão único com `AnimatePresence` do site
 * antigo: o embla traz o arrasto com o dedo, que era o que faltava no celular,
 * e a navegação por seta do teclado. O contador e os pontos leem o índice da
 * API do carrossel, então não há segundo estado para divergir do que está na
 * tela.
 */
export function Work(): React.JSX.Element {
  const [api, setApi] = React.useState<CarouselApi>()
  const [active, setActive] = React.useState(0)

  React.useEffect(() => {
    if (!api) return

    function sync(): void {
      if (!api) return

      setActive(api.selectedScrollSnap())
    }

    sync()
    api.on('select', sync)

    return () => {
      api.off('select', sync)
    }
  }, [api])

  return (
    <section data-slot="home-work" className="overflow-hidden py-24 md:py-32">
      <div className={cn(REVEAL, 'mx-auto max-w-2xl px-4 text-center')}>
        <h2 className="text-h2">{m.home_workTitle()}</h2>
        <span aria-hidden="true" className="brand-bar mx-auto mt-5" />
      </div>

      <div
        aria-hidden="true"
        className="relative mt-10 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
      >
        <ul className="marquee flex w-max gap-16 pr-16">
          {[...MARQUEE, ...MARQUEE].map((project, index) => (
            <li
              key={index}
              className="font-display text-h3 font-medium tracking-[-0.015em] text-foreground/45"
            >
              {project.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-14 max-w-7xl px-4 md:px-8">
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          aria-label={m.home_workTitle()}
        >
          <CarouselContent>
            {projects.map((project, index) => (
              <CarouselItem key={project.slug}>
                <article
                  className={cn(
                    'relative overflow-hidden rounded-[1.75rem]',
                    CARD_TINTS[index % CARD_TINTS.length],
                  )}
                >
                  <div className="flex items-center justify-between px-6 pt-6 text-small text-foreground/60 md:px-10 md:pt-8">
                    <span>{localized(project.client)}</span>
                    <span>
                      {pad(index + 1)} / {pad(projects.length)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-12 md:gap-10 md:p-10">
                    <div className="flex flex-col justify-between gap-8 md:col-span-6">
                      <div>
                        <h3 className="text-h1">{project.title}</h3>
                        <p className="mt-6 max-w-[48ch] font-serif text-lead leading-snug text-foreground/85">
                          “{localized(project.description)}”
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <PillButton
                          tone="outline"
                          className="rounded-xl"
                          render={
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {m.home_workVisit()}
                              <ArrowUpRightIcon />
                            </a>
                          }
                        />
                        <ul className="flex flex-wrap gap-1.5">
                          {project.tech.slice(0, 3).map((tech) => (
                            <li
                              key={tech}
                              className="rounded-full bg-surface/60 px-3 py-1 text-micro text-foreground/80"
                            >
                              {tech}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:col-span-6">
                      <img
                        src={project.image}
                        alt={project.title}
                        width={1863}
                        height={927}
                        loading="lazy"
                        decoding="async"
                        style={{ objectPosition: project.focus }}
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-6 flex items-center justify-center gap-4">
            {/*
              Os botões do registry, tirados da posição absoluta das bordas: lá
              eles flutuam fora do cartão, e aqui ficam embaixo, com os pontos
              no meio. `aria-label` sobre o texto oculto em inglês que o
              componente traz.
            */}
            <CarouselPrevious
              aria-label={m.a11y_previousProject()}
              size="icon-lg"
              className="static inset-auto m-0 size-10 translate-none"
            />
            <div className="flex">
              {projects.map((project, index) => (
                <button
                  key={project.slug}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={project.title}
                  aria-current={index === active}
                  data-active={index === active}
                  className="group flex h-8 items-center px-2"
                >
                  <span className="block h-1.5 w-1.5 rounded-full bg-foreground/25 transition-[width,background-color] duration-500 group-data-[active=true]:w-6 group-data-[active=true]:bg-foreground motion-reduce:transition-none" />
                </button>
              ))}
            </div>
            <CarouselNext
              aria-label={m.a11y_nextProject()}
              size="icon-lg"
              className="static inset-auto m-0 size-10 translate-none"
            />
          </div>
        </Carousel>
      </div>
    </section>
  )
}
