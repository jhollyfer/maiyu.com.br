import logo512 from '#/assets/brand/logo-512.png'
import { env } from '#/env'

/**
 * What identifies the site in the metadata of every route.
 *
 * The constants appear in the root `head`, which is the default, and in the `head` of the routes
 * that write their own. Writing them by hand in both places would make one page's link card
 * announce something other than the home.
 */

/** The company name, and what goes at the end of every title. */
export const SITE_TITLE = 'Maiyu'

/**
 * The public address, without a trailing slash, coming from `VITE_SITE_URL` (`lib/build-env.ts`):
 * the same origin the kit's canonical, sitemap and `robots.txt` use, and not a second literal.
 *
 * Only for what needs an absolute URL. An internal link is a relative path: hard-coding the domain
 * in them would break navigation in any environment other than production.
 */
export const SITE_URL = env.VITE_SITE_URL

/**
 * The brand image in the structured data, absolute because whoever reads it is an outside
 * crawler: a relative path would resolve against the scraper's domain. It is the same
 * `logo-512.png` from `assets/brand/` that the kit's `pageHead` uses in `og:image`
 * (`frontend.md` §9.7), and not a second file in `public/`.
 */
export const SITE_IMAGE = new URL(logo512, SITE_URL).href

/** The path becomes an absolute address, for `canonical` and `og:url`. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`
}

/** Maiyu's WhatsApp, digits only with the country code. */
export const WHATSAPP_NUMBER = '5597984317149'

/**
 * "Schedule a conversation" opens WhatsApp. It is the channel that people who hire in the region
 * already use, and the site closes the loop instead of competing with it.
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
