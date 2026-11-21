import { WhatsappLogoIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { ContactLink } from '#/components/common/contact-link/contact-link'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { buttonVariants } from '#/components/ui/button'
import { CALL_URL, CONTACT } from '#/lib/site'
import { m } from '#/paraglide/messages'

/**
 * The notice in place of the contact and application forms: it says the form is offline and
 * takes the person to the channels that really exist, the email and the WhatsApp from
 * `lib/site.ts`. There is no field or submission, and the text never says something was
 * received: whoever types a whole message into a form that does not deliver loses the text and
 * believes they spoke to Maiyu (`docs/DECISIONS.md` #17).
 */
export function ChannelsNotice(): React.JSX.Element {
  return (
    <Alert data-slot="channels-notice" className="p-6 md:p-8">
      <AlertTitle className="text-h4">{m.channels_notice_title()}</AlertTitle>
      <AlertDescription className="mt-2 text-body">
        <p>{m.channels_notice_body()}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <ContactLink
            kind="email"
            value={CONTACT.email}
            variant="default"
            size="lg"
          >
            {m.channels_notice_email()}
          </ContactLink>
          <a
            href={CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            <WhatsappLogoIcon aria-hidden="true" />
            {m.channels_notice_whatsapp()}
          </a>
        </div>
      </AlertDescription>
    </Alert>
  )
}
