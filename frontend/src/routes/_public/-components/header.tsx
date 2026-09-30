import type * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ListIcon, WhatsappLogoIcon } from '@phosphor-icons/react'

import { LanguageSwitcher } from './language-switcher'
import { CONTACT_LINK, MOBILE_NAVIGATION, NAVIGATION } from './menu'
import { navLinkVariants } from './nav-link'
import { useScrolled } from './use-scrolled'
import { PillButton } from '#/components/common/pill-button'
import { ThemeToggle } from '#/components/common/theme-toggle'
import { Button } from '#/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '#/components/ui/navigation-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { CALL_URL, SITE_TITLE } from '#/lib/site'
import { m } from '#/paraglide/messages'

/**
 * O cabeçalho flutuante.
 *
 * Transparente no topo, e ganha fundo, aro e sombra quando a página rola: é a
 * pílula que acompanha a leitura sem cobrir o céu do hero na chegada. O estado
 * vem de `useScrolled`, e o desenho de cada estado mora em classes
 * `data-[scrolled=true]:`, sem ternário.
 *
 * `NavigationMenu` na barra e `Sheet` no celular, como no academy: as duas
 * primitivas já trazem foco preso, `Esc`, `aria-expanded` e trava de rolagem,
 * que é o que o overlay escrito à mão do site antigo fazia pela metade.
 */
export function Header(): React.JSX.Element {
  const scrolled = useScrolled(24)

  return (
    <header
      data-slot="site-header"
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3"
    >
      <div
        data-scrolled={scrolled}
        className="mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-transparent bg-transparent pr-2 pl-4 transition-[max-width,background-color,border-color,box-shadow] duration-700 ease-out-expo motion-reduce:transition-none data-[scrolled=true]:max-w-5xl data-[scrolled=true]:border-foreground/[0.08] data-[scrolled=true]:bg-surface/80 data-[scrolled=true]:shadow-[0_8px_30px_-12px_var(--shadow-tint)] data-[scrolled=true]:backdrop-blur-xl lg:grid-cols-[auto_1fr_auto]"
      >
        <Link
          to="/"
          aria-label={m.a11y_home()}
          className="flex items-center gap-2 justify-self-start py-2"
        >
          <img src="/maiyu-symbol.svg" alt="" className="size-7" />
          <span className="font-brand text-lg tracking-[0.08em] text-foreground uppercase dark:text-brand-green">
            {SITE_TITLE}
          </span>
        </Link>

        <NavigationMenu
          aria-label={m.a11y_mainNav()}
          className="hidden flex-none lg:flex lg:pl-10"
        >
          <NavigationMenuList className="gap-1">
            {NAVIGATION.map((item) => (
              <NavigationMenuItem key={item.to}>
                <NavigationMenuLink
                  className={navLinkVariants({ tone: 'bar' })}
                  render={<Link to={item.to} />}
                >
                  {item.label()}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-1.5 justify-self-end">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle className="hidden size-9 rounded-full md:inline-flex" />
          <PillButton
            tone="outline"
            scale="md"
            className="ml-1 hidden rounded-xl md:inline-flex"
            render={<Link to={CONTACT_LINK.to}>{CONTACT_LINK.label()}</Link>}
          />
          <PillButton
            tone="neon"
            scale="md"
            className="hidden rounded-xl md:inline-flex"
            render={
              <a href={CALL_URL} target="_blank" rel="noopener noreferrer">
                <WhatsappLogoIcon />
                {m.nav_getInTouch()}
              </a>
            }
          />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

/**
 * O menu do celular.
 *
 * Painel de cima, ocupando a tela, e não o lateral do academy: é o desenho do
 * site no ar, com os destinos em títulos grandes, e o painel estreito de lado
 * os espremeria em duas linhas.
 *
 * Cada link fecha o painel com `SheetClose render={<Link />}`, e não com um
 * `onClick` que mexe em estado: a navegação e o fechamento saem do mesmo
 * clique, e o componente continua não controlado.
 */
function MobileMenu(): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-11 rounded-full lg:hidden"
            aria-label={m.a11y_openMenu()}
          >
            <ListIcon />
          </Button>
        }
      />
      <SheetContent
        side="top"
        className="h-dvh bg-background/95 px-4 pt-20 pb-10 backdrop-blur-2xl"
      >
        {/*
          Título e descrição sempre, como pede o padrão do Sheet: é o que o
          leitor de tela anuncia ao abrir. Aqui os dois ficam só para ele, porque
          a marca já está no cabeçalho logo acima.
        */}
        <SheetHeader className="sr-only">
          <SheetTitle>{SITE_TITLE}</SheetTitle>
          <SheetDescription>{m.a11y_mainNav()}</SheetDescription>
        </SheetHeader>

        <nav
          aria-label={m.a11y_mainNav()}
          className="grid flex-1 auto-rows-min overflow-y-auto"
        >
          {MOBILE_NAVIGATION.map((item) => (
            <SheetClose
              key={item.to}
              nativeButton={false}
              render={
                <Link
                  to={item.to}
                  className={navLinkVariants({ tone: 'sheet' })}
                >
                  {item.label()}
                  <span
                    aria-hidden="true"
                    className="brand-bar hidden w-10 group-data-[status=active]:block"
                  />
                </Link>
              }
            />
          ))}
        </nav>

        <SheetFooter className="flex-row items-center justify-between gap-4 px-0">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle className="size-11 rounded-full" />
          </div>
          <PillButton
            tone="neon"
            render={
              <a href={CALL_URL} target="_blank" rel="noopener noreferrer">
                <WhatsappLogoIcon />
                {m.nav_getInTouch()}
              </a>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
