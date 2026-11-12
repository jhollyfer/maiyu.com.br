/**
 * Generates the icons in `public/` from `public/favicon.svg`.
 *
 * A script and not a comment line: there are four files, and one of them is `.ico`, which sharp
 * does not write, so the format has to be assembled by hand. When the logo changes, the command
 * is a single one:
 *
 *   node scripts/generate-icons.mjs
 *
 * The binaries stay versioned: they are served statically and the build does not generate them.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')
// The kit's `og:image` (`lib/page-head.ts`) imports `assets/brand/logo-512.png`, and the bundler
// gives it the hashed address; it is the same drawing as the manifest's 512 icon.
const BRAND = join(ROOT, 'src', 'assets', 'brand')
const SOURCE = join(PUBLIC, 'favicon.svg')

/**
 * A high `density` when reading the SVG: sharp rasterizes the vector at the requested density
 * before resizing, and at the default (72dpi) a 64px SVG becomes a 64px bitmap that is then
 * **enlarged** to 512, so the icon comes out blurry.
 */
function render(size) {
  return sharp(SOURCE, { density: 384 }).resize(size, size).png()
}

/**
 * Packs a PNG into a single-image `.ico`.
 *
 * The format has accepted embedded PNG since Vista, and it is what every browser that still asks
 * for `/favicon.ico` understands. Writing the classic BMP would require the AND mask and the
 * palette, and nothing that requests this file needs that.
 *
 * The header is fixed: a 6-byte directory, one 16-byte entry, and the PNG right after, which is
 * why the image offset is 22.
 */
function ico(png, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // 1 = icon
  header.writeUInt16LE(1, 4) // one image

  const entry = Buffer.alloc(16)
  // 0 means 256 in the format; 32 fits in a byte and goes in literally.
  entry.writeUInt8(size, 0)
  entry.writeUInt8(size, 1)
  entry.writeUInt8(0, 2) // no palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, png])
}

const targets = [
  // What a browser that does not read SVG asks for on its own, by convention, at the root.
  { name: 'favicon.ico', size: 32, wrap: ico },
  // The shortcut on the iOS home screen, which ignores the manifest.
  { name: 'apple-touch-icon.png', size: 180 },
  // The two sizes the manifest declares.
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'logo-512.png', size: 512, dir: BRAND },
]

for (const { name, size, wrap, dir = PUBLIC } of targets) {
  const png = await render(size).toBuffer()
  const output = wrap?.(png, size) ?? png

  await writeFile(join(dir, name), output)
  process.stdout.write(`${name} (${size}x${size}, ${output.length} bytes)\n`)
}

// A cheap check: the `.ico` has to start with the icon directory, and an offset
// error would only show up as a tab without an icon months later.
const written = await readFile(join(PUBLIC, 'favicon.ico'))
if (written.readUInt16LE(2) !== 1)
  throw new Error('favicon.ico is not a valid icon')
