import type * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpIcon, ArrowUpRightIcon } from '@phosphor-icons/react'

import { FOOTER_NAVIGATION } from './menu'
import { navLinkVariants } from './nav-link'
import { Button } from '#/components/ui/button'
import { currentYear } from '#/lib/i18n'
import { CONTACT, SITE_TITLE, SOCIALS } from '#/lib/site'
import { m } from '#/paraglide/messages'

/**
 * O rodapé: o trançado como topo, quatro colunas separadas por fios, o botão
 * de voltar ao topo e o "MAIYU" gigante de assinatura.
 *
 * O botão fica em `relative z-10` e o wordmark em `pointer-events-none`: sem
 * isso o texto gigante, que sobe por cima da linha do botão pela entrelinha
 * de 0.9, engolia o clique.
 */
export function Footer(): React.JSX.Element {
  const year = currentYear()

  return (
    <footer
      data-slot="site-footer"
      className="relative isolate overflow-hidden pt-20"
    >
      <div aria-hidden="true" className="trancado absolute inset-x-0 top-0" />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 border-y border-border md:grid-cols-4 md:divide-x md:divide-border">
          <div className="border-b border-border py-8 md:border-b-0 md:px-8 md:first:pl-0">
            <img src="/maiyu-symbol.svg" alt="" className="mb-5 size-9" />
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
          <p className="text-small text-foreground/70">
            © {year} {SITE_TITLE}. {m.footer_rights()}. {m.footer_signoff()}
          </p>
          <Button
            type="button"
            size="icon-lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={m.footer_backToTop()}
            className="size-11 rounded-full bg-brand-green text-navy transition-transform duration-300 hover:-translate-y-0.5 hover:bg-brand-green motion-reduce:transition-none"
          >
            <ArrowUpIcon size={15} />
          </Button>
        </div>

        <p
          aria-hidden="true"
          className="pointer-events-none text-center font-brand text-[clamp(3.5rem,17vw,14rem)] leading-[0.9] text-forest uppercase opacity-15 select-none dark:text-brand-green dark:opacity-15"
        >
          {SITE_TITLE}
        </p>
      </div>
    </footer>
  )
}
