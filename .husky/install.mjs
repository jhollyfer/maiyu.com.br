// The root `prepare` runs on every install of the workspace, including the filtered one in the
// Docker image (`--filter "{./backend}..."`), where the root devDependency `husky` is not installed
// and the hook would be useless. There a bare `prepare: "husky"` fails with "command not found" and
// takes the install with it. The shape is the one from the Husky docs for Docker
// (_doc-lib/husky.md#how-to.html, https://typicode.github.io/husky/how-to.html), plus the
// `HUSKY=0` the library already honors. Use `"prepare": "node .husky/install.mjs"` at the root.
const skip = [process.env.NODE_ENV === 'production', process.env.HUSKY === '0']

if (skip.includes(true)) process.exit(0)

const husky = (await import('husky')).default
console.log(husky())
