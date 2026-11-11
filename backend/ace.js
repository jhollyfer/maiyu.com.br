/*
|--------------------------------------------------------------------------
| JavaScript entrypoint for running ace commands
|--------------------------------------------------------------------------
|
| `node` cannot run the TypeScript source, so this file registers the
| @poppinss/ts-exec hook and hands over to `bin/console.ts`. The production
| build replaces it (docs.adonisjs.com/guides/typescript-build-process).
|
*/

import '@poppinss/ts-exec'

await import('./bin/console.js')
