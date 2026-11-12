import { ArrowUpIcon, ArrowUpRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import logo from '#/assets/brand/logo.svg'
import { MaiyuCredit } from '#/components/common/maiyu-credit/maiyu-credit'
import { Picture } from '#/components/common/picture/picture'
import { Button } from '#/components/ui/button'
import { CONTACT, SITE_TITLE, SOCIALS } from '#/lib/site'
import { m } from '#/paraglide/messages'

import { FOOTER_NAVIGATION } from './menu'
import { navLinkVariants } from './nav-link'

// The giant signature is a drawing and not a paragraph: it is decoration at 15% opacity,
// and as text axe measured its contrast (1.22:1) even with `aria-hidden`. The viewBox is
// 0.9 em tall (the old line height) and 4.8123 em wide, the width of "MAIYU" in Michroma,
// so the height keeps the old `clamp` and the width follows from it.
const WORDMARK_FONT_SIZE = 100
const WORDMARK_VIEW_BOX = '0 0 481.23 90'

/**
 * The footer: the weave as the top, four columns separated by lines, the back-to-top button
 * and the giant "MAIYU" signature.
 *
 * The button sits in `relative z-10` and the wordmark in `pointer-events-none`: without
 * this the giant text, which rises over the button's line through the 0.9 line height,
 * swallowed the click.
 */
export function Footer(): React.JSX.Element {
  return (
    <footer
      data-slot="site-footer"
      className="relative isolate overflow-hidden pt-20"
    >
      <div aria-hidden="true" className="trancado absolute inset-x-0 top-0" />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 border-y border-border md:grid-cols-4 md:divide-x md:divide-border">
          <div className="border-b border-border py-8 md:border-b-0 md:px-8 md:first:pl-0">
            <Picture
              src={logo}
              alt=""
              width={36}
              height={36}
              placement="fold"
              className="mb-5 size-9"
            />
            <p className="max-w-xs font-serif text-body-lg leading-snug text-foreground/85">
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

        <div className="relative z-10 flex flex-col items-center gap-4 pt-16 pb-8 text-center">
          <MaiyuCredit className="text-small text-foreground/70" />
          <Button
            type="button"
            size="icon-lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={m.footer_back_to_top()}
            className="size-11 rounded-full bg-brand-green text-navy transition-transform duration-300 hover:-translate-y-0.5 hover:bg-brand-green motion-reduce:transition-none"
          >
            <ArrowUpIcon size={15} />
          </Button>
        </div>

        <svg
          aria-hidden="true"
          focusable="false"
          viewBox={WORDMARK_VIEW_BOX}
          className="pointer-events-none mx-auto block h-[calc(clamp(3.5rem,17vw,14rem)*0.9)] w-auto overflow-visible text-forest opacity-15 select-none dark:text-brand-green dark:opacity-15"
        >
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={WORDMARK_FONT_SIZE}
            fill="currentColor"
            className="font-brand uppercase"
          >
            {SITE_TITLE}
          </text>
        </svg>
      </div>
    </footer>
  )
}
