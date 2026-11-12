import { EnvelopeSimpleIcon, WhatsappLogoIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { CALL_URL, CONTACT } from '#/lib/site'
import { m } from '#/paraglide/messages'

import { PillButton } from './pill-button'

/**
 * O aviso no lugar dos formulários de contato e de candidatura: diz que o
 * formulário está fora do ar e leva a pessoa aos canais que existem de
 * verdade, o e-mail e o WhatsApp de `lib/site.ts`. Não há campo nem envio, e o
 * texto nunca diz que algo foi recebido: quem digita uma mensagem inteira num
 * formulário que não entrega perde o texto e acredita que falou com a Maiyu
 * (`docs/DECISIONS.md` #17).
 */
export function ChannelsNotice(): React.JSX.Element {
  return (
    <Alert data-slot="channels-notice" className="p-6 md:p-8">
      <AlertTitle className="text-h4">{m.channels_notice_title()}</AlertTitle>
      <AlertDescription className="mt-2 text-body">
        <p>{m.channels_notice_body()}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <PillButton
            render={
              <a href={'mailto:'.concat(CONTACT.email)}>
                <EnvelopeSimpleIcon aria-hidden="true" />
                {m.channels_notice_email()}
              </a>
            }
          />
          <PillButton
            tone="outline"
            render={
              <a href={CALL_URL} target="_blank" rel="noopener noreferrer">
                <WhatsappLogoIcon aria-hidden="true" />
                {m.channels_notice_whatsapp()}
              </a>
            }
          />
        </div>
      </AlertDescription>
    </Alert>
  )
}
