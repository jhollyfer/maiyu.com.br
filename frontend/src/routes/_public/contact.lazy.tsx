import type * as React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import {
  EnvelopeSimpleIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

import { ContactForm } from './-components/contact-form'
import { PageHero } from './-components/page-hero'
import { Photo } from './-components/photo'
import { REVEAL, STAGGER } from './-components/reveal'
import { CALL_URL, CONTACT } from '#/lib/site'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

export const Route = createLazyFileRoute('/_public/contact')({
  component: RouteComponent,
})

type Channel = {
  icon: Icon
  title: () => string
  subtitle: () => string
  /** Cada linha do canal; `href` ausente é texto, e não link. */
  lines: ReadonlyArray<{ text: string; href?: string }>
}

/** Os jeitos de falar com a Maiyu fora do formulário. */
const CHANNELS: ReadonlyArray<Channel> = [
  {
    icon: WhatsappLogoIcon,
    title: () => m.contactPage_whatsappTitle(),
    subtitle: () => m.contactPage_whatsappSubtitle(),
    lines: [{ text: CONTACT.phone, href: CALL_URL }],
  },
  {
    icon: EnvelopeSimpleIcon,
    title: () => m.contactPage_emailTitle(),
    subtitle: () => m.contactPage_emailSubtitle(),
    lines: [
      { text: CONTACT.email, href: 'mailto:'.concat(CONTACT.email) },
      {
        text: CONTACT.supportEmail,
        href: 'mailto:'.concat(CONTACT.supportEmail),
      },
    ],
  },
  {
    icon: PhoneIcon,
    title: () => m.contactPage_phoneTitle(),
    subtitle: () => m.contactPage_phoneSubtitle(),
    lines: [
      { text: CONTACT.phone, href: CONTACT.phoneHref },
      { text: CONTACT.secondPhone, href: CONTACT.secondPhoneHref },
    ],
  },
  {
    icon: MapPinIcon,
    title: () => m.contactPage_locationTitle(),
    subtitle: () => m.contactPage_locationSubtitle(),
    lines: [{ text: CONTACT.street }, { text: CONTACT.district }],
  },
]

/**
 * Contato: os canais em lista com fios, o formulário ao lado e a cidade embaixo.
 *
 * Os canais vêm de `CONTACT`, em `lib/site.ts`, e não escritos aqui: o rodapé
 * e o JSON-LD da raiz mostram os mesmos dados, e três cópias do telefone
 * divergiriam na primeira troca de número.
 */
function RouteComponent(): React.JSX.Element {
  return (
    <>
      <PageHero
        title={m.contactPage_title()}
        lead={m.contactPage_description()}
      >
        <ul className="flex flex-col gap-3 text-body-lg">
          {[m.contactPage_languages(), m.contactPage_audience()].map((text) => (
            <li key={text} className={cn(REVEAL, 'flex items-start gap-4')}>
              <span
                aria-hidden="true"
                className="mt-3 size-2 shrink-0 rotate-45 bg-urucum"
              />
              {text}
            </li>
          ))}
        </ul>
      </PageHero>

      <section data-slot="contact-body" className="pb-24 md:pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-4 md:px-8 lg:grid-cols-12">
          <ul className="divide-y divide-border border-y border-border lg:col-span-5 lg:self-start">
            {CHANNELS.map((channel, index) => (
              <li
                key={index}
                className={cn(REVEAL, 'py-6')}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <div className="flex items-center gap-2 text-small text-muted-foreground">
                  <channel.icon size={18} aria-hidden="true" />
                  {channel.title()}
                </div>
                <h2 className="mt-2 text-h4 font-medium">
                  {channel.subtitle()}
                </h2>
                <ul className="mt-3 space-y-1 text-body">
                  {channel.lines.map((line) => (
                    <li key={line.text}>
                      {line.href && (
                        <a
                          href={line.href}
                          className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-urucum"
                        >
                          {line.text}
                        </a>
                      )}
                      {!line.href && line.text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div className="lg:col-span-7">
            <h2 className="mb-6 text-h2">{m.contactPage_formTitle()}</h2>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="trancado" />

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Photo
            name="town"
            ratio={21 / 9}
            sizes="(min-width: 1280px) 1216px, 100vw"
          />
        </div>
      </section>
    </>
  )
}
