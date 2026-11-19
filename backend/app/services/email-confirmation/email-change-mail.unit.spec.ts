import app from '@adonisjs/core/services/app'
import { I18n } from '@adonisjs/i18n'
import { test } from '@japa/runner'

import EmailChangeMailService from './email-change-mail.service.ts'

import { EmailChangeContract } from '#services/email-change/email-change.contract'
import { MailContract } from '#services/mail/mail.contract'
import { MailFake } from '#services/mail/mail.fake'
import { makeWithMemory } from '#tests/container-fixtures'

async function setup(smtp = true) {
  const mail = new MailFake(smtp)
  const service = await makeWithMemory(EmailChangeMailService, [
    [MailContract, mail],
  ])
  const i18n = await app.container.make(I18n)

  return { mail, service, i18n }
}

test.group('services > email-confirmation > mail (unit)', () => {
  test('the contract is answered by the mail service in the project that has the block', async ({
    assert,
  }) => {
    assert.instanceOf(
      await app.container.make(EmailChangeContract),
      EmailChangeMailService,
    )
  })

  test('it is available only with SMTP', async ({ assert }) => {
    assert.isTrue((await setup(true)).service.isAvailable())
    assert.isFalse((await setup(false)).service.isAvailable())
  })

  test('the delivery mails the token to the new address, in the language of the request', async ({
    assert,
  }) => {
    const { mail, service, i18n } = await setup()

    await service.deliver(
      { to: 'nova@mail.com', token: 'ab12'.repeat(16) },
      i18n,
    )

    const [sent] = mail.sent
    assert.equal(sent?.to, 'nova@mail.com')
    assert.equal(sent?.subject, 'Confirme o novo e-mail da sua conta')
    assert.include(sent?.html ?? '', '<code>' + 'ab12'.repeat(16) + '</code>')
    assert.include(sent?.html ?? '', '60 minutos')
  })

  test('without SMTP nothing is sent', async ({ assert }) => {
    const { mail, service, i18n } = await setup(false)

    await service.deliver(
      { to: 'nova@mail.com', token: 'ab12'.repeat(16) },
      i18n,
    )

    assert.lengthOf(mail.sent, 0)
  })
})
