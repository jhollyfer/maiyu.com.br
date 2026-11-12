// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CALL_URL, CONTACT } from '#/lib/site'
import { overwriteGetLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

import { ChannelsNotice } from './channels-notice'

afterEach(cleanup)

/**
 * Contact and careers have no form (`docs/DECISIONS.md` #17): the page shows only the honest
 * notice and the real channels. The test covers what is seen, in the three languages, and what
 * must not appear: a field, a submit button, "sent" or "received" text.
 */
const TITLES: ReadonlyArray<[Locale, string]> = [
  ['pt-BR', 'O formulário está fora do ar por enquanto'],
  ['en', 'The form is offline for now'],
  ['es', 'El formulario está fuera de servicio por ahora'],
]

describe('ChannelsNotice', () => {
  it.each(TITLES)(
    'when the locale is %s, it shows the notice and both real channels',
    (locale, title) => {
      overwriteGetLocale(() => locale)

      const { container } = render(<ChannelsNotice />)

      expect(container.textContent).toContain(title)
      expect(
        container.querySelector(`a[href="mailto:${CONTACT.email}"]`),
      ).not.toBeNull()
      expect(container.querySelector(`a[href="${CALL_URL}"]`)).not.toBeNull()
    },
  )

  it('when rendered, it has no form, field or submit button, and claims nothing was received', () => {
    overwriteGetLocale(() => 'pt-BR')

    const { container } = render(<ChannelsNotice />)

    expect(container.querySelector('form, input, textarea, select')).toBeNull()
    expect(container.querySelector('button, [type="submit"]')).toBeNull()
    expect(container.textContent).not.toMatch(/enviad|recebid|sent|received/i)
  })
})
