import { Outlet, createFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { m } from '#/paraglide/messages'

import { Footer } from './-components/footer'
import { Header } from './-components/header'

/**
 * The site.
 *
 * No guard at all, and not by oversight: it is the whole storefront, and there is no
 * authenticated area in this project. The shell (header, content, footer) lives here and
 * not in `__root.tsx` so that the 404 and the router's error, which do not go through
 * this layout, draw the screen on their own and without a broken menu.
 */
export const Route = createFileRoute('/_public')({
  component: RouteComponent,
})

/** The target of the "skip to content" link. */
const MAIN_ID = 'conteudo'

function RouteComponent(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/*
        The first focusable element on the page. `sr-only` with `focus:not-sr-only`
        and not `display: none`: truly hidden, the link would not receive focus.
      */}
      <a
        href={'#'.concat(MAIN_ID)}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-brand-green"
      >
        {m.a11y_skip_to_content()}
      </a>
      <Header />
      <main id={MAIN_ID} tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
