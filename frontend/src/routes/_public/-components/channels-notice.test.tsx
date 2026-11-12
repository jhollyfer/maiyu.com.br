// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CALL_URL, CONTACT } from '#/lib/site'
import { overwriteGetLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

import { ChannelsNotice } from './channels-notice'

afterEach(cleanup)

/**
 * Contato e carreiras não têm formulário (`docs/DECISIONS.md` #17): a página
 * mostra só o aviso honesto e os canais reais. O teste cobre o que se vê, nas
 * três línguas, e o que não pode aparecer: campo, botão de envio, texto de
 * "enviado" ou "recebido".
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

describe('the contact and careers pages', () => {
  const here = dirname(fileURLToPath(import.meta.url))

  it.each(['contact/-components/contact.tsx', 'career/-components/career.tsx'])(
    '%s renders the notice and no <form>',
    (file) => {
      const source = readFileSync(join(here, '..', file), 'utf8')

      expect(source).toContain('<ChannelsNotice />')
      expect(source).not.toMatch(/<form[\s>]|Form\b/)
    },
  )
})
