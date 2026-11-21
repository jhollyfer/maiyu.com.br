import { ArrowUpIcon, ArrowUpRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark/brand-mark'
import { MaiyuCredit } from '#/components/common/maiyu-credit/maiyu-credit'
import { Button } from '#/components/ui/button'
import { CONTACT, SOCIALS } from '#/lib/site'
import { m } from '#/paraglide/messages'

import { FOOTER_NAVIGATION } from './menu'
import { navLinkVariants } from './nav-link'

/**
 * The footer: a hairline as the top, four columns separated by lines, the credit and a text
 * link back to the top. No giant signature and no colored button (`docs/DESIGN.md` §7): the
 * logo and the line of text already sign the page.
 */
export function Footer(): React.JSX.Element {
  return (
    <footer data-slot="site-footer" className="relative pt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 border-y border-border md:grid-cols-4 md:divide-x md:divide-border">
          <div className="border-b border-border py-8 md:border-b-0 md:px-8 md:first:pl-0">
            <BrandMark className="mb-5" />
            <p className="max-w-xs text-body-lg leading-snug text-foreground/85">
              {m.footer_tagline()}
            </p>
          </div>

          <div className="border-b border-border py-8 md:border-b-0 md:px-8 md:first:pl-0">
            <p className="mb-4 text-small text-muted-foreground">
              {m.footer_navigation()}
            </p>
            <ul>
              {FOOTER_NAVIGATION.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={navLinkVariants({ tone: 'footer' })}
                  >
                    {link.label()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-b border-border py-8 md:border-b-0 md:px-8 md:first:pl-0">
            <p className="mb-4 text-small text-muted-foreground">
              {m.footer_social()}
            </p>
            <ul>
              {SOCIALS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={navLinkVariants({ tone: 'footer' })}
                  >
                    {social.name}
                    <ArrowUpRightIcon size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="py-8 md:px-8 md:last:pr-0">
            <p className="mb-4 text-small text-muted-foreground">
              {m.footer_contact()}
            </p>
            <ul className="text-body text-foreground/70">
              <li className="py-2">{CONTACT.street}</li>
              <li className="py-2">{CONTACT.district}</li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className={navLinkVariants({ tone: 'footer' })}
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.phoneHref}
                  className={navLinkVariants({ tone: 'footer' })}
                >
                  {CONTACT.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 py-10 md:flex-row md:items-center">
          <MaiyuCredit className="text-small text-foreground/70" />
          <Button
            type="button"
            variant="link"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-0"
          >
            {m.footer_back_to_top()}
            <ArrowUpIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </footer>
  )
}
