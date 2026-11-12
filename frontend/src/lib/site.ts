import { env } from '#/env'

/**
 * O que identifica o site nos metadados de toda rota.
 *
 * As constantes aparecem no `head` da raiz, que é o padrão, e no `head` das
 * rotas que escrevem o seu. Escrevê-las à mão nos dois lugares faria o cartão
 * de link de uma página anunciar outra coisa que a home.
 */

/** O nome da empresa, e o que fica no fim de todo título. */
export const SITE_TITLE = 'Maiyu'

/**
 * O endereço público, sem barra no fim, vindo de `VITE_SITE_URL` (`lib/build-env.ts`): a mesma
 * origem que o canônico, o sitemap e o `robots.txt` do kit usam, e não um segundo literal.
 *
 * Só para o que precisa de URL absoluta. Link interno é caminho relativo - cravar o domínio
 * neles quebraria a navegação em qualquer ambiente que não fosse produção.
 */
export const SITE_URL = env.VITE_SITE_URL

/**
 * A imagem do cartão de link, absoluta porque quem a lê é um rastreador de
 * fora: caminho relativo em `og:image` resolveria contra o domínio de quem
 * raspa.
 */
export const SITE_IMAGE = `${SITE_URL}/og-image.png`

/** O caminho vira endereço absoluto, para `canonical` e `og:url`. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`
}

/** O WhatsApp da Maiyu, só dígitos com o código do país. */
export const WHATSAPP_NUMBER = '5597984317149'

/**
 * "Agendar conversa" abre o WhatsApp. É o canal que quem contrata na região já
 * usa, e o site fecha o ciclo em vez de competir com ele.
 */
export const CALL_URL = `https://wa.me/${WHATSAPP_NUMBER}`

export const CONTACT = {
  email: 'contato@maiyu.com.br',
  supportEmail: 'suporte@maiyu.com.br',
  phone: '+55 (97) 9 8431-7149',
  phoneHref: 'tel:+5597984317149',
  secondPhone: '+55 (97) 9 8414-5765',
  secondPhoneHref: 'tel:+5597984145765',
  street: 'Rua Gildo Sampaio, 140',
  district: 'CM Filadelfia, Benjamin Constant, AM',
} as const

export const SOCIALS = [
  { name: 'GitHub', href: 'https://github.com/maiyu-dev' },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/maiyu' },
] as const
