import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ListIcon } from '@phosphor-icons/react'
import { useMotionValueEvent, useScroll } from 'motion/react'

import { MAIN_LINKS, MOBILE_LINKS } from './nav-links'
import { LanguageSwitcher } from './language-switcher'
import { CtaLink } from '#/components/common/cta-link'
import { ThemeToggle } from '#/components/common/theme-toggle'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { CALL_URL } from '#/lib/site'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/**
 * O cabeçalho flutuante.
 *
 * Transparente no topo, e ganha fundo, aro e sombra quando a página rola - é
 * a pílula que acompanha a leitura sem cobrir o céu do hero na chegada. O
 * estado vem do `useScroll` do motion, que já assina a rolagem uma vez só para
 * a página inteira.
 *
 * O link ativo é marcado pelo `data-status="active"` que o `Link` do router
 * escreve sozinho (junto com `aria-current="page"`), e não por comparação de
 * `pathname` à mão.
 */
export function Header(): React.JSX.Element {
  const [scrolled, setScrolled] = React.useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div
        data-scrolled={scrolled}
        className={cn(
          'mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-transparent bg-transparent pr-2 pl-4 transition-[max-width,background-color,border-color,box-shadow] duration-700 ease-out-expo lg:grid-cols-[auto_1fr_auto]',
          'data-[scrolled=true]:max-w-5xl data-[scrolled=true]:border-foreground/[0.08] data-[scrolled=true]:bg-surface/80 data-[scrolled=true]:shadow-[0_8px_30px_-12px_var(--shadow-tint)] data-[scrolled=true]:backdrop-blur-xl',
        )}
      >
        <Link
          to="/"
          aria-label={m.a11y_home()}
          className="flex items-center gap-2 justify-self-start py-2"
        >
          <img src="/maiyu-symbol.svg" alt="" className="size-7" />
          <span className="font-brand text-lg tracking-[0.08em] text-foreground uppercase dark:text-brand-green">
            Maiyu
          </span>
        </Link>

        <nav className="hidden lg:block lg:pl-10" aria-label={m.a11y_mainNav()}>
          <ul className="flex items-center gap-1">
            {MAIN_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="rounded-full px-4 py-2 text-small font-medium text-foreground/70 transition-colors duration-300 hover:text-foreground data-[status=active]:bg-foreground/[0.06] data-[status=active]:font-semibold data-[status=active]:text-foreground data-[status=active]:underline data-[status=active]:decoration-brand-green data-[status=active]:decoration-2 data-[status=active]:underline-offset-[6px] dark:data-[status=active]:text-brand-green"
                >
                  {link.label()}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 justify-self-end">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle className="hidden size-9 rounded-full md:inline-flex" />
          <CtaLink
            to="/contact"
            variant="soft"
            className="ml-1 hidden rounded-xl px-4 py-2 md:inline-flex"
          >
            {m.nav_contact()}
          </CtaLink>
          <CtaLink
            to={CALL_URL}
            variant="brand"
            className="hidden rounded-xl px-4 py-2 md:inline-flex"
          >
            {m.nav_getInTouch()}
          </CtaLink>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

/**
 * O menu do celular, sobre o `Sheet` do registry.
 *
 * `Sheet` e não o overlay feito à mão do site antigo: o do registry já trava a
 * rolagem do fundo, prende o foco dentro dele, fecha no `Esc` e devolve o foco
 * ao botão - as quatro coisas que o overlay antigo fazia pela metade.
 *
 * Cada link fecha o painel com `SheetClose render={<Link />}`: a navegação e o
 * fechamento saem do mesmo clique, sem estado próprio para sincronizar.
 */
function MobileMenu(): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger
        aria-label={m.a11y_openMenu()}
        className="inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/[0.06] lg:hidden"
      >
        <ListIcon size={20} />
      </SheetTrigger>
      <SheetContent
        side="top"
        className="h-dvh bg-background/95 px-4 pt-24 pb-10 backdrop-blur-2xl"
      >
        <SheetTitle className="sr-only">{m.a11y_mainNav()}</SheetTitle>
        <nav aria-label={m.a11y_mainNav()} className="flex-1">
          <ul className="flex flex-col">
            {MOBILE_LINKS.map((link) => (
              <li key={link.to}>
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      to={link.to}
                      className="group flex items-center justify-between border-b border-foreground/[0.08] py-5 font-display text-4xl font-bold tracking-[-0.015em] text-foreground/60 data-[status=active]:text-foreground"
                    >
                      {link.label()}
                      <span
                        aria-hidden="true"
                        className="brand-bar hidden w-10 group-data-[status=active]:block"
                      />
                    </Link>
                  }
                />
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-between gap-4 pt-10">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle className="size-9 rounded-full" />
          </div>
          <CtaLink to={CALL_URL} variant="brand">
            {m.nav_getInTouch()}
          </CtaLink>
        </div>
      </SheetContent>
    </Sheet>
  )
}
