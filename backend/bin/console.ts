/*
|--------------------------------------------------------------------------
| Ace entrypoint
|--------------------------------------------------------------------------
|
| Boots the command-line framework. A command only boots the application when
| it sets `options.startApp`.
|
*/

await import('reflect-metadata')
const { Ignitor, prettyPrintError } = await import('@adonisjs/core')

// The committed `openapi.json` must not depend on whose environment generated it (DECISIONS.md
// #406): the upload ceiling is the only ENV value the document carries, so the generator fixes it.
// A value already in `process.env` wins over the `.env` files, and this runs before `#start/env`.
if (process.argv[2] === 'openapi:generate')
  process.env.UPLOAD_MAX_SIZE = '1073741824'

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
    .ace()
    .handle(process.argv.splice(2))
} catch (error) {
  process.exitCode = 1
  await prettyPrintError(error)
}
