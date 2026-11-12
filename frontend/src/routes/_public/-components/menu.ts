import { linkOptions } from '@tanstack/react-router'

import { m } from '#/paraglide/messages'

/**
 * The site's destinations, typed against the route tree.
 *
 * The same design as adacaibs' `menu.ts`: header, phone panel and footer draw the **same**
 * list, and writing it three times would guarantee they diverge the day a screen
 * changes address.
 *
 * `linkOptions` and not a loose object: it preserves the type of `to`, so a removed or
 * renamed route becomes a compile error here.
 *
 * `label` is a function and not text, and that is the difference from adacaibs: the paraglide
 * message has to be read at render time, in the language of whoever visits.
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
  typeof HOME | typeof PORTFOLIO | typeof BLOG | typeof CAREER | typeof CONTACT

/**
 * The desktop bar. Without "Home", because the brand on the left already leads to the
 * home, and without "Contact", because it is an action and lives as a button beside it.
 */
export const NAVIGATION: ReadonlyArray<MenuItem> = [PORTFOLIO, BLOG, CAREER]

/** The phone panel: the bar plus contact, which has no button of its own there. */
export const MOBILE_NAVIGATION: ReadonlyArray<MenuItem> = [
  PORTFOLIO,
  BLOG,
  CAREER,
  CONTACT,
]

/** The footer: all destinations, the home first. */
export const FOOTER_NAVIGATION: ReadonlyArray<MenuItem> = [
  HOME,
  PORTFOLIO,
  BLOG,
  CAREER,
  CONTACT,
]

/** Contact, which the header draws as a pill and not as a bar link. */
export const CONTACT_LINK = CONTACT
