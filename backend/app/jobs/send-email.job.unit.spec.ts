import { test } from '@japa/runner'

import SendEmailJob from '#jobs/send-email.job'

test.group('jobs > send-email (unit)', () => {
  test('when the mailer is in the config, it passes with the type mail.use() accepts', ({
    assert,
  }) => {
    assert.equal(SendEmailJob.knownMailer('smtp'), 'smtp')
  })

  test('when the mailer is not in the config, it fails loudly instead of sending through the wrong one', ({
    assert,
  }) => {
    assert.throws(
      () => SendEmailJob.knownMailer('ses'),
      'Unknown mailer "ses" in a queued e-mail',
    )
    assert.throws(() => SendEmailJob.knownMailer('toString'), /Unknown mailer/)
  })

  test('when the job is declared, it retries three times with a growing delay on the default queue', ({
    assert,
  }) => {
    assert.equal(SendEmailJob.options.retry?.maxRetries, 3)
    assert.isFunction(SendEmailJob.options.retry?.backoff)
    assert.isUndefined(SendEmailJob.options.queue)
  })
})
