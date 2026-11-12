import { Outlet, createFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { m } from '#/paraglide/messages'

import { Footer } from './-components/footer'
import { Header } from './-components/header'

/**
 * O site.
 *
 * Sem guard nenhum, e não por esquecimento: é a vitrine inteira, e não há área
 * autenticada neste projeto. A casca (cabeçalho, conteúdo, rodapé) mora aqui e
 * não no `__root.tsx` para que o 404 e o erro do router, que não passam por
 * este layout, desenhem a tela sozinha e sem menu quebrado.
 */
export const Route = createFileRoute('/_public')({
  component: RouteComponent,
})

/** O alvo do "pular para o conteúdo". */
const MAIN_ID = 'conteudo'

function RouteComponent(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/*
        Primeiro elemento focável da página. `sr-only` com `focus:not-sr-only`
        e não `display: none`: escondido de verdade o link não receberia foco.
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
