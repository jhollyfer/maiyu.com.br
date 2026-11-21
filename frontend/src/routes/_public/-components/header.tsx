import { ListIcon, WhatsappLogoIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark/brand-mark'
import { LocaleSwitcher } from '#/components/common/locale-switcher/locale-switcher'
import { ThemeToggle } from '#/components/common/theme/theme-toggle'
import { Button, buttonVariants } from '#/components/ui/button'
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
import { cn } from '#/lib/cn'
import { CALL_URL, SITE_TITLE } from '#/lib/site'
import { m } from '#/paraglide/messages'

import { MOBILE_NAVIGATION, NAVIGATION } from './menu'
import { navLinkVariants } from './nav-link'
import { useScrolled } from './use-scrolled'

/**
 * The floating header.
 *
 * Transparent at the top, and it gains a background and a line underneath when the page scrolls:
 * a newspaper bar that follows the reading without covering the cover on arrival. The state
 * comes from `useScrolled`, and the drawing of each state lives in `data-[scrolled=true]:`
 * classes, with no ternary.
 *
 * `NavigationMenu` on the bar and `Sheet` on the phone, as in academy: both primitives
 * already bring a focus trap, `Esc`, `aria-expanded` and scroll lock, which is what the old
 * site's hand-written overlay did by halves.
 */
export function Header(): React.JSX.Element {
  const scrolled = useScrolled(24)

  return (
    <header
      data-slot="site-header"
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,border-color] duration-200 ease-out-expo data-[scrolled=true]:border-border data-[scrolled=true]:bg-background motion-reduce:transition-none"
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 md:px-8 lg:grid-cols-[auto_1fr_auto]">
        <Link
          to="/"
          aria-label={m.a11y_home()}
          className="flex items-center gap-2 justify-self-start py-2"
        >
          <BrandMark />
        </Link>

        <NavigationMenu
          aria-label={m.a11y_main_nav()}
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
            <LocaleSwitcher className="w-36" />
          </div>
          <ThemeToggle className="hidden size-9 md:inline-flex" />
          <a
            href={CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants(), 'hidden md:inline-flex')}
          >
            <WhatsappLogoIcon />
            {m.nav_get_in_touch()}
          </a>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

/**
 * The phone menu.
 *
 * A top panel, filling the screen, and not academy's side one: it is the design of the live
 * site, with the destinations in large headings, and a narrow side panel would squeeze them
 * into two lines.
 *
 * Each link closes the panel with `SheetClose render={<Link />}`, and not with an
 * `onClick` that touches state: navigation and closing come from the same click, and the
 * component stays uncontrolled.
 */
function MobileMenu(): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-label={m.a11y_open_menu()}
          >
            <ListIcon />
          </Button>
        }
      />
      <SheetContent side="top" className="h-dvh bg-background px-4 pt-20 pb-10">
        {/*
          Title and description always, as the Sheet pattern asks: it is what the screen
          reader announces on opening. Here both are only for it, because the brand
          is already in the header right above.
        */}
        <SheetHeader className="sr-only">
          <SheetTitle>{SITE_TITLE}</SheetTitle>
          <SheetDescription>{m.a11y_main_nav()}</SheetDescription>
        </SheetHeader>

        <nav
          aria-label={m.a11y_main_nav()}
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
                </Link>
              }
            />
          ))}
        </nav>

        <SheetFooter className="flex-row items-center justify-between gap-4 px-0">
          <div className="flex items-center gap-2">
            <LocaleSwitcher className="w-36" />
            <ThemeToggle className="size-11" />
          </div>
          <a
            href={CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: 'lg' })}
          >
            <WhatsappLogoIcon />
            {m.nav_get_in_touch()}
          </a>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
