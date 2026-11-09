/*
|--------------------------------------------------------------------------
| Test runner entrypoint
|--------------------------------------------------------------------------
|
| Boots the application in the `test` environment and hands over to Japa.
| Run through `node ace test <suite>`.
|
*/

// Before any import: `#start/env` and the configs read it while loading.
process.env.NODE_ENV = 'test'

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@japa/runner'

const APP_ROOT = new URL('../', import.meta.url)

// Relative paths resolve against the application root, not this file, so the
// same importer works from `bin/` in source and from `build/bin/` once compiled.
const IMPORTER = function (filePath: string) {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

try {
  await new Ignitor(APP_ROOT, { importer: IMPORTER })
    .tap(function (app) {
      app.booting(async function () {
        await import('#start/env')
      })
      // The signal emitter does not await the return: `void` says shutdown runs on its own.
      app.listen('SIGTERM', function () {
        void app.terminate()
      })
      app.listenIf(app.managedByPm2, 'SIGINT', function () {
        void app.terminate()
      })
    })
    .testRunner()
    .configure(async function (app) {
      const { runnerHooks, ...config } = await import('../tests/bootstrap.js')

      processCLIArgs(process.argv.splice(2))
      configure({
        ...app.rcFile.tests,
        ...config,
        setup: runnerHooks.setup,
        // Terminating last closes the database pool, so the process exits instead of hanging.
        teardown: runnerHooks.teardown.concat([
          function () {
            return app.terminate()
          },
        ]),
      })
    })
    .run(function () {
      return run()
    })
} catch (error) {
  process.exitCode = 1
  await prettyPrintError(error)
}
