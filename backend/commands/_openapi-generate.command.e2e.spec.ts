import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

const run = promisify(execFile)

/**
 * The committed `openapi.json` is the same in every environment (DECISIONS.md #406): whoever
 * generates it with another `UPLOAD_MAX_SIZE` in `.env`, `.env.test` or the shell must still get
 * a document that `openapi:check` accepts, or the check passes in one place and fails in the other.
 */
test.group('openapi:generate > environment', () => {
  test('when the upload ceiling of the environment changes, the document stays the same', async ({
    assert,
  }) => {
    const { stdout } = await run(
      process.execPath,
      ['ace.js', 'openapi:generate', '--check', '--strict'],
      {
        cwd: app.makePath(),
        env: { ...process.env, UPLOAD_MAX_SIZE: '7' },
      },
    )

    assert.include(stdout, 'is up to date')
  }).timeout(30_000)
})
