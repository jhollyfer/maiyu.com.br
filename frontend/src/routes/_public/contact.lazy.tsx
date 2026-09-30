import type * as React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { EnvelopeIcon, MapPinIcon, PhoneIcon } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

import { ContactForm } from './-components/contact-form'
import { PageHero } from './-components/page-hero'
import { REVEAL, STAGGER } from './-components/reveal'
import { CONTACT } from '#/lib/site'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

export const Route = createLazyFileRoute('/_public/contact')({
  component: RouteComponent,
})

type Channel = {
  icon: Icon
  tint: string
  title: () => string
  subtitle: () => string
  /** Cada linha do cartão; `href` ausente é texto, e não link. */
  lines: ReadonlyArray<{ text: string; href?: string }>
}

/** Os três jeitos de falar com a Maiyu fora do formulário. */
const CHANNELS: ReadonlyArray<Channel> = [
  {
    icon: EnvelopeIcon,
    tint: 'bg-tint-mint',
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
    tint: 'bg-tint-peach',
    title: () => m.contactPage_phoneTitle(),
    subtitle: () => m.contactPage_phoneSubtitle(),
    lines: [
      { text: CONTACT.phone, href: CONTACT.phoneHref },
      { text: CONTACT.secondPhone, href: CONTACT.secondPhoneHref },
    ],
  },
  {
    icon: MapPinIcon,
    tint: 'bg-tint-lime',
    title: () => m.contactPage_locationTitle(),
    subtitle: () => m.contactPage_locationSubtitle(),
    lines: [{ text: CONTACT.street }, { text: CONTACT.district }],
  },
]

/**
 * Contato: o formulário e os três cartões de canal ao lado.
 *
 * Os cartões vêm de `CONTACT`, em `lib/site.ts`, e não escritos aqui: o
 * rodapé e o JSON-LD da raiz mostram os mesmos dados, e três cópias do
 * telefone divergiriam na primeira troca de número.
 */
function RouteComponent(): React.JSX.Element {
  return (
    <>
      <PageHero
        title={m.contactPage_title()}
        lead={m.contactPage_description()}
      />

      <section data-slot="contact-body" className="pb-24 md:pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 md:px-8 lg:grid-cols-12">
          <div
            className={cn(
              REVEAL,
              'rounded-[1.75rem] bg-tint-mist p-6 md:p-10 lg:col-span-7',
            )}
          >
            <ContactForm />
          </div>

          <ul className="flex flex-col gap-4 lg:col-span-5">
            {CHANNELS.map((channel, index) => (
              <li
                key={index}
                className={cn(
                  REVEAL,
                  'flex-1 rounded-[1.75rem] p-6 md:p-8',
                  channel.tint,
                )}
                style={{ animationDelay: `${(index + 1) * STAGGER}ms` }}
              >
                <div className="flex items-center gap-2 text-small text-foreground/70">
                  <channel.icon size={16} />
                  {channel.title()}
                </div>
                <h2 className="mt-3 text-h4 font-medium">
                  {channel.subtitle()}
                </h2>
                <ul className="mt-4 space-y-1 text-body">
                  {channel.lines.map((line) => (
                    <li key={line.text}>
                      {line.href && (
                        <a
                          href={line.href}
                          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
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
        </div>
      </section>
    </>
  )
}
