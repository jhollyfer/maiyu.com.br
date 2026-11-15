import { Logger } from '@adonisjs/core/logger'
import { test } from '@japa/runner'

import loggerConfig from '#config/logger'
import LogRedact from '#core/log-redact'

/**
 * The redaction of the configured logger, through Pino itself: the paths are read by Pino at
 * boot, and only a line written by it proves that a path was accepted and reaches the field.
 * The `redact` is the one of `config/logger.ts`, not `LogRedact` directly, so a config that
 * stops using it fails here.
 */
class RedactedLine {
  /** The JSON line the configured redaction writes for `record`. */
  static of(record: Record<string, unknown>): string {
    const lines: Array<string> = []
    const logger = new Logger({
      enabled: true,
      name: 'log-redact-spec',
      level: 'info',
      redact: loggerConfig.loggers.app.redact,
      destination: {
        write: (line: string) => {
          lines.push(line)
        },
      },
    })

    logger.info(record, 'spec')

    return lines.join('')
  }
}

const SECRET = 's3cr3t-que-nao-pode-vazar'

test.group('core > log redact (unit)', () => {
  test('a password is redacted at the root and one, two and three levels deep', ({
    assert,
  }) => {
    const line = RedactedLine.of({
      password: SECRET,
      user: { password: SECRET },
      payload: { user: { password: SECRET } },
      body: { data: { user: { currentPassword: SECRET } } },
      list: [{ passwordConfirmation: SECRET }],
    })

    assert.notInclude(line, SECRET)
    assert.include(line, LogRedact.CENSOR)
  })

  test('tokens are redacted under any key', ({ assert }) => {
    const line = RedactedLine.of({
      token: SECRET,
      session: { accessToken: SECRET, refreshToken: SECRET },
      grant: { pair: { token: SECRET } },
    })

    assert.notInclude(line, SECRET)
  })

  test('Authorization and Cookie of the request are redacted', ({ assert }) => {
    const line = RedactedLine.of({
      req: {
        method: 'POST',
        headers: { authorization: `Bearer ${SECRET}`, cookie: SECRET },
      },
      headers: { authorization: SECRET, cookie: SECRET },
    })

    assert.notInclude(line, SECRET)
    // What is not a secret stays, so the line is still useful.
    assert.include(line, '"method":"POST"')
  })

  test('Authorization and Cookie are redacted three levels deep', ({
    assert,
  }) => {
    // `a.b.headers.authorization`: the request logged inside a payload nested twice, the depth the
    // `*.*.*` prefix exists for.
    const line = RedactedLine.of({
      context: {
        req: {
          headers: { authorization: `Bearer ${SECRET}`, cookie: SECRET },
        },
      },
    })

    assert.notInclude(line, SECRET)
    assert.include(line, LogRedact.CENSOR)
  })

  test('Set-Cookie of the response is redacted', ({ assert }) => {
    const line = RedactedLine.of({
      res: {
        statusCode: 204,
        headers: { 'set-cookie': [`access-token=${SECRET}; HttpOnly`] },
      },
      headers: { 'set-cookie': SECRET },
      'set-cookie': SECRET,
    })

    assert.notInclude(line, SECRET)
    assert.include(line, '"statusCode":204')
  })

  test('Set-Cookie is redacted three levels deep', ({ assert }) => {
    const line = RedactedLine.of({
      context: {
        res: { headers: { 'set-cookie': [`refresh-token=${SECRET}`] } },
      },
    })

    assert.notInclude(line, SECRET)
    assert.include(line, LogRedact.CENSOR)
  })

  test('a document (CPF and CNPJ) is redacted under any key', ({ assert }) => {
    const line = RedactedLine.of({
      cpf: SECRET,
      payload: { customer: { cpf: SECRET }, tenant: { cnpj: SECRET } },
    })

    assert.notInclude(line, SECRET)
  })

  test('a field with no secret name is logged as is', ({ assert }) => {
    const line = RedactedLine.of({ user: { id: 'u1', email: 'a@b.c' } })

    assert.include(line, '"email":"a@b.c"')
    assert.notInclude(line, LogRedact.CENSOR)
  })
})
