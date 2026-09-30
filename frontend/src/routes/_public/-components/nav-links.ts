import { m } from '#/paraglide/messages'

/**
 * Os destinos do site, numa lista só: o menu de desktop, o do celular e o
 * rodapé leem daqui, e três cópias divergiriam no primeiro link novo.
 *
 * `label` é função e não texto: a mensagem do paraglide precisa ser lida no
 * render, no idioma da requisição, e não uma vez no carregamento do módulo.
 */
export const MAIN_LINKS = [
  { to: '/portfolio', label: () => m.nav_portfolio() },
  { to: '/blog', label: () => m.nav_blog() },
  { to: '/career', label: () => m.nav_career() },
] as const

export const MOBILE_LINKS = [
  ...MAIN_LINKS,
  { to: '/contact', label: () => m.nav_contact() },
] as const

export const FOOTER_LINKS = [
  { to: '/', label: () => m.nav_home() },
  ...MOBILE_LINKS,
] as const
