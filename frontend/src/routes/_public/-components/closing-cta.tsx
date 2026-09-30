import type * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRightIcon } from '@phosphor-icons/react'

import { REVEAL } from './reveal'
import { PillButton } from './pill-button'
import { Forest } from '#/components/common/sky'
import { CALL_URL } from '#/lib/site'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/**
 * O convite final: a frase grande sobre a mata e as duas ações.
 *
 * "Agendar conversa" abre o WhatsApp, e não a página de contato: é o fim da
 * leitura, e quem chegou até aqui já decidiu falar. O formulário continua a um
 * link embaixo, para quem prefere escrever.
 */
export function ClosingCta(): React.JSX.Element {
  return (
    <section
      data-slot="home-closing-cta"
      className="relative overflow-hidden py-28 md:py-36"
    >
      <Forest className="h-[34%] opacity-70" />
      <div
        className={cn(
          REVEAL,
          'relative mx-auto flex max-w-3xl flex-col items-center px-4 text-center',
        )}
      >
        <h2 className="text-display tracking-[-0.015em] text-foreground">
          {m.home_ctaTitle()}
        </h2>
        <p className="mt-6 max-w-[40ch] font-serif text-lead text-foreground/80">
          {m.home_ctaDesc()}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <PillButton
            className="rounded-xl"
            render={
              <a href={CALL_URL} target="_blank" rel="noopener noreferrer">
                {m.home_startProject()}
                <ArrowUpRightIcon />
              </a>
            }
          />
          <PillButton
            tone="outline"
            className="rounded-xl"
            render={<Link to="/portfolio">{m.home_viewWork()}</Link>}
          />
        </div>
        <Link
          to="/contact"
          className="mt-6 inline-flex min-h-11 items-center gap-1 text-small text-foreground/60 hover:text-foreground"
        >
          {m.nav_contact()} <ArrowUpRightIcon size={13} />
        </Link>
      </div>
    </section>
  )
}
