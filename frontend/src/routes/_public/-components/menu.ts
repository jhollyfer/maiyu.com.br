import { linkOptions } from '@tanstack/react-router'

import { m } from '#/paraglide/messages'

/**
 * Os destinos do site, tipados contra a árvore de rotas.
 *
 * O mesmo desenho do `menu.ts` do adacaibs: cabeçalho, painel do celular e
 * rodapé desenham a **mesma** lista, e escrevê-la três vezes garantiria que
 * elas divergissem no dia em que uma tela mudar de endereço.
 *
 * `linkOptions` e não um objeto solto: ele preserva o tipo de `to`, então rota
 * removida ou renomeada vira erro de compilação aqui.
 *
 * `label` é função e não texto, e é a diferença para o adacaibs: a mensagem do
 * paraglide precisa ser lida no render, no idioma de quem visita.
 */
const HOME = linkOptions({ to: '/', label: () => m.nav_home() })

const PORTFOLIO = linkOptions({
  to: '/portfolio',
  label: () => m.nav_portfolio(),
})

const BLOG = linkOptions({ to: '/blog', label: () => m.nav_blog() })

const CAREER = linkOptions({ to: '/career', label: () => m.nav_career() })

const CONTACT = linkOptions({ to: '/contact', label: () => m.nav_contact() })

export type MenuItem =
  | typeof HOME
  | typeof PORTFOLIO
  | typeof BLOG
  | typeof CAREER
  | typeof CONTACT

/**
 * A barra do desktop. Sem "Início", porque a marca à esquerda já leva para a
 * home, e sem "Contato", porque ele é ação e mora como botão ao lado.
 */
export const NAVIGATION: ReadonlyArray<MenuItem> = [PORTFOLIO, BLOG, CAREER]

/** O painel do celular: a barra mais o contato, que lá não tem botão próprio. */
export const MOBILE_NAVIGATION: ReadonlyArray<MenuItem> = [
  PORTFOLIO,
  BLOG,
  CAREER,
  CONTACT,
]

/** O rodapé: todos os destinos, a home primeiro. */
export const FOOTER_NAVIGATION: ReadonlyArray<MenuItem> = [
  HOME,
  PORTFOLIO,
  BLOG,
  CAREER,
  CONTACT,
]

/** O contato, que o cabeçalho desenha como pílula e não como link da barra. */
export const CONTACT_LINK = CONTACT
