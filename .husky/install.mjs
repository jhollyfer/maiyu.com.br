// The root `prepare` runs on every install of the workspace, including the filtered one in the
// Docker image (`--filter "{./backend}..."`), where the root devDependency `husky` is not installed
// and there is no `.git`. There a bare `prepare: "husky"` fails with "command not found" and takes
// the install with it. The skip is decided by what is missing, not by NODE_ENV: a developer shell
// or a CI that exports `NODE_ENV=production` still needs the hook, and a fresh clone or worktree
// (where `.git` is a file) gets it on the first install. Shape from the Husky docs for Docker
// (_doc-lib/husky.md#how-to.html, https://typicode.github.io/husky/how-to.html), plus the
// `HUSKY=0` the library already honors. Use `"prepare": "node .husky/install.mjs"` at the root.
import { existsSync } from 'node:fs'

const skip = [process.env.HUSKY === '0', !existsSync('.git')]

if (skip.includes(true)) process.exit(0)

// Only "package not found" is the Docker case; any other failure while loading husky is a real error.
const husky = await import('husky').then(
  (module) => module.default,
  (error) => {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null
    throw error
  },
)
if (husky) console.log(husky())
