import app from '@adonisjs/core/services/app'
import mail from '@adonisjs/mail/services/main'
import { test } from '@japa/runner'

import { MailContract } from '#services/mail/mail.contract'
import { MailFake } from '#services/mail/mail.fake'
import MailService from '#services/mail/mail.service'

const MESSAGE = {
  to: 'student@example.com',
  subject: 'Invite',
  html: '<p>Hello</p>',
}

test.group('services > mail (unit)', (group) => {
  group.each.teardown(() => mail.restore())

  test('when the contract is resolved, the container answers with MailService', async ({
    assert,
  }) => {
    assert.instanceOf(await app.container.make(MailContract), MailService)
  })

  test('when SMTP is configured, the message goes to the queue', async ({
    assert,
  }) => {
    const { messages } = mail.fake()
    const service = await app.container.make(MailService, ['smtp.example.com'])

    assert.isTrue(service.isConfigured())
    assert.equal(await service.sendLater(MESSAGE), 'queued')
    messages.assertQueued(
      (queued) =>
        queued.hasTo(MESSAGE.to) && queued.hasSubject(MESSAGE.subject),
    )
  })

  test('when SMTP is missing, nothing is queued and the result is skipped', async ({
    assert,
  }) => {
    const { messages } = mail.fake()
    const service = await app.container.make(MailService, [''])

    assert.isFalse(service.isConfigured())
    assert.equal(await service.sendLater(MESSAGE), 'skipped')
    messages.assertNoneQueued()
  })
})

test.group('services > mail > fake', () => {
  test('when configured, it keeps what would be sent', async ({ assert }) => {
    const fake = new MailFake()

    assert.equal(await fake.sendLater(MESSAGE), 'queued')
    assert.deepEqual(fake.sent, [MESSAGE])
  })

  test('when SMTP is missing, it skips and keeps nothing', async ({
    assert,
  }) => {
    const fake = new MailFake(false)

    assert.isFalse(fake.isConfigured())
    assert.equal(await fake.sendLater(MESSAGE), 'skipped')
    assert.deepEqual(fake.sent, [])
  })
})
