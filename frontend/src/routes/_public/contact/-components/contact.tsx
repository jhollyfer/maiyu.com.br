import {
  EnvelopeSimpleIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type * as React from 'react'

import { CALL_URL, CONTACT } from '#/lib/site'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

import { ChannelsNotice } from '../../-components/channels-notice'
import { PageHero } from '../../-components/page-hero'
import { Photo } from '../../-components/photo'
import { REVEAL, STAGGER } from '../../-components/reveal'

type Channel = {
  icon: Icon
  title: () => string
  subtitle: () => string
  /** Each line of the channel; a missing `href` is text, not a link. */
  lines: ReadonlyArray<{ text: string; href?: string }>
}

/** The ways to talk to Maiyu, since the site has no form. */
const CHANNELS: ReadonlyArray<Channel> = [
  {
    icon: WhatsappLogoIcon,
    title: () => m.contact_page_whatsapp_title(),
    subtitle: () => m.contact_page_whatsapp_subtitle(),
    lines: [{ text: CONTACT.phone, href: CALL_URL }],
  },
  {
    icon: EnvelopeSimpleIcon,
    title: () => m.contact_page_email_title(),
    subtitle: () => m.contact_page_email_subtitle(),
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
    title: () => m.contact_page_phone_title(),
    subtitle: () => m.contact_page_phone_subtitle(),
    lines: [
      { text: CONTACT.phone, href: CONTACT.phoneHref },
      { text: CONTACT.secondPhone, href: CONTACT.secondPhoneHref },
    ],
  },
  {
    icon: MapPinIcon,
    title: () => m.contact_page_location_title(),
    subtitle: () => m.contact_page_location_subtitle(),
    lines: [{ text: CONTACT.street }, { text: CONTACT.district }],
  },
]

/**
 * Contact: the channels in a ruled list, the notice that the form is offline
 * beside it and the city below.
 *
 * The channels come from `CONTACT`, in `lib/site.ts`, and are not written here: the footer
 * and the root JSON-LD show the same data, and three copies of the phone number
 * would diverge on the first number change.
 */
export function Contact(): React.JSX.Element {
  return (
    <>
      <PageHero
        title={m.contact_page_title()}
        lead={m.contact_page_description()}
      >
        <ul className="flex flex-col gap-3 text-body-lg">
          {[m.contact_page_languages(), m.contact_page_audience()].map(
            (text) => (
              <li key={text} className={cn(REVEAL, 'flex items-start gap-4')}>
                <span
                  aria-hidden="true"
                  className="mt-3 size-2 shrink-0 rotate-45 bg-urucum"
                />
                {text}
              </li>
            ),
          )}
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
            <ChannelsNotice />
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
