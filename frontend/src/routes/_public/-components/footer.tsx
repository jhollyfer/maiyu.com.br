import { Link } from '@tanstack/react-router'
import { ArrowUpIcon, ArrowUpRightIcon } from '@phosphor-icons/react'

import { FOOTER_LINKS } from './nav-links'
import { SkyBackdrop } from '#/components/common/sky'
import { CONTACT, SITE_TITLE, SOCIALS } from '#/lib/site'
import { m } from '#/paraglide/messages'

const LINK =
  'group inline-flex items-center gap-1 py-1.5 text-body text-foreground/70 transition-colors duration-300 hover:text-foreground'

/**
 * O rodapé: o cartão de quatro colunas sobre o céu, o botão de voltar ao topo
 * e o "MAIYU" gigante de assinatura.
 *
 * O botão fica em `relative z-10` e o wordmark em `pointer-events-none`: sem
 * isso o texto gigante, que sobe por cima da linha do botão pela entrelinha
 * de 0.9, engolia o clique.
 */
export function Footer(): React.JSX.Element {
  const year = new Date().getFullYear()

  return (
    <footer className="relative isolate overflow-hidden pt-4">
      <SkyBackdrop
        fade={false}
        className="top-[45%] -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_35%)]"
      />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-background md:grid-cols-4 md:divide-x md:divide-foreground/10">
          <div className="border-b border-foreground/10 p-8 md:border-b-0">
            <img src="/maiyu-symbol.svg" alt="" className="mb-5 size-9" />
            <p className="max-w-xs font-serif text-body-lg leading-snug text-foreground/85">
              {m.footer_tagline()}
            </p>
          </div>

          <div className="border-b border-foreground/10 p-8 md:border-b-0">
            <p className="mb-4 text-small text-muted-foreground">
              {m.footer_navigation()}
            </p>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={LINK}>
                    {link.label()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-b border-foreground/10 p-8 md:border-b-0">
            <p className="mb-4 text-small text-muted-foreground">
              {m.footer_social()}
            </p>
            <ul className="space-y-2">
              {SOCIALS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK}
                  >
                    {social.name}
                    <ArrowUpRightIcon size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8">
            <p className="mb-4 text-small text-muted-foreground">
              {m.footer_contact()}
            </p>
            <ul className="space-y-2 text-body text-foreground/70">
              <li>{CONTACT.street}</li>
              <li>{CONTACT.district}</li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className={LINK}>
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={CONTACT.phoneHref} className={LINK}>
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
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={m.footer_backToTop()}
            className="inline-flex size-11 items-center justify-center rounded-full bg-brand-green text-navy transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowUpIcon size={15} />
          </button>
        </div>

        <p
          aria-hidden="true"
          className="pointer-events-none text-center font-brand text-[clamp(3.5rem,17vw,14rem)] leading-[0.9] uppercase opacity-25 select-none text-gradient-green dark:opacity-20"
        >
          {SITE_TITLE}
        </p>
      </div>
    </footer>
  )
}
