/**
 * Generates the app icons of `public/` from the same mark `BrandMark` draws: the Phosphor symbol of
 * `src/lib/brand.ts` (`BRAND.icon`) in `--primary-foreground` on a `--primary` disc, both read from
 * the project's theme (`src/styles.css`, light theme). One command when the symbol or the theme
 * changes (`frontend.md` §6, "A marca"):
 *
 *   node scripts/generate-icons.mjs
 *   node scripts/generate-icons.mjs --logo=src/assets/brand/logo.svg
 *
 * With `--logo` the owner's own logo file is the mark, as `BRAND.logo` replaces the symbol on screen.
 *
 * Why Chromium and not an image library: the project has no image dependency, and the browser the
 * e2e suite already needs renders the SVG exactly as users see it, and resolves the theme's `oklch()`
 * colors. The binaries are versioned (they are served as static files and the build does not make
 * them). Set `E2E_CHROMIUM_PATH` when the browser is not where Playwright expects it.
 *
 * Outputs in `public/`: favicon.svg, favicon.ico (48, PNG inside), apple-touch-icon.png (180),
 * icon-192.png and icon-512.png (the disc on transparent, for the manifest), icon-maskable-512.png
 * (symbol in the 80% safe zone over a solid square) and og-image.png (1200x630, the link preview).
 * The manifest itself (`name`, `lang`, `scope`) is the project's: it points at these files.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const FRONTEND = join(dirname(fileURLToPath(import.meta.url)), '..')
const ICON_VIEWBOX = 256

/** The inside of an `<svg>` markup, without the wrapper: the symbol's paths, for re-wrapping. */
export function innerOf(markup) {
  return markup.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
}

/**
 * The favicon: the disc (a circle of the primary color) with the symbol at half its size. `inner`
 * is the symbol's paths in a 256 box, painted by the `fill` of the wrapper.
 */
export function faviconSvg({ inner, primary, foreground }) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
    `  <circle cx="16" cy="16" r="16" fill="${primary}"/>`,
    `  <svg x="8" y="8" width="16" height="16" viewBox="0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}" fill="${foreground}">${inner}</svg>`,
    '</svg>',
    '',
  ].join('\n')
}

/** An `.ico` with one PNG image: every browser that still asks for it reads this. */
export function ico(png, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size, 0)
  entry.writeUInt8(size, 1)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, png])
}

/** The favicon file: the owner's logo as it is, or the disc with the symbol. */
function faviconSource({ ownLogo, markup, ...colors }) {
  if (ownLogo) {
    return markup
  }

  return faviconSvg(colors)
}

function argValue(name) {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`))

  return hit?.slice(name.length + 3)
}

/** The symbol's SVG markup: the project's logo file, or the Phosphor icon rendered `fill`. */
async function symbolMarkup(logoPath) {
  if (logoPath !== undefined) {
    return readFileSync(resolve(FRONTEND, logoPath), 'utf8')
  }

  const { createElement } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { BRAND } = await import(
    pathToFileURL(join(FRONTEND, 'src/lib/brand.ts')).href
  )

  return renderToStaticMarkup(createElement(BRAND.icon, { weight: 'fill' }))
}

async function main() {
  const { chromium } = await import('@playwright/test')
  const css = readFileSync(join(FRONTEND, 'src/styles.css'), 'utf8')
  const messages = JSON.parse(
    readFileSync(join(FRONTEND, 'messages/pt-BR.json'), 'utf8'),
  )
  const publicDir = join(FRONTEND, 'public')
  mkdirSync(publicDir, { recursive: true })

  const browser = await chromium.launch({
    executablePath: process.env.E2E_CHROMIUM_PATH,
  })
  const page = await browser.newPage()

  // The browser resolves the theme's custom properties (`var()`, `oklch()`) to the sRGB the
  // favicon and the PNGs need: the real stylesheet is loaded, and the light `:root` is read.
  await page.setContent(`<style>${css}</style><body></body>`)
  async function hex(token) {
    return await page.evaluate((name) => {
      const probe = document.createElement('i')
      probe.style.color = `var(${name})`
      document.body.append(probe)
      const resolved = getComputedStyle(probe).color
      const context = document.createElement('canvas').getContext('2d')
      context.fillStyle = resolved
      context.fillRect(0, 0, 1, 1)
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data

      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
    }, token)
  }

  const primary = await hex('--primary')
  const foreground = await hex('--primary-foreground')
  const markup = await symbolMarkup(argValue('logo'))
  const inner = innerOf(markup)
  const ownLogo = argValue('logo') !== undefined

  function symbol(size, color) {
    if (ownLogo) {
      return `<div style="width:${size}px;height:${size}px">${markup.replace('<svg ', '<svg width="100%" height="100%" ')}</div>`
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}" fill="${color}">${inner}</svg>`
  }

  // The disc on transparent: the symbol at half the disc, as `BrandMark` draws it.
  // `inverted` swaps the two colors, for the preview card whose background is already the primary.
  function disc(size, inverted = false) {
    const back = [primary, foreground][Number(inverted)]
    const front = [foreground, primary][Number(inverted)]

    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${back};display:grid;place-items:center">${symbol(size / 2, front)}</div>`
  }
  // A solid square for what the platform masks (iOS, maskable): the symbol inside the 80% safe zone.
  const square = (size) =>
    `<div style="width:${size}px;height:${size}px;background:${primary};display:grid;place-items:center">${symbol(Math.round(size * 0.5), foreground)}</div>`

  async function shot(html, width, height, transparent) {
    const background = { true: 'transparent', false: primary }[transparent]
    await page.setViewportSize({ width, height })
    await page.setContent(
      `<body style="margin:0;background:${background}">${html}</body>`,
    )

    return await page.screenshot({ omitBackground: transparent })
  }

  const out = (name, data) => writeFileSync(join(publicDir, name), data)

  out(
    'favicon.svg',
    faviconSource({ ownLogo, markup, inner, primary, foreground }),
  )
  out('favicon.ico', ico(await shot(disc(48), 48, 48, true), 48))
  out('apple-touch-icon.png', await shot(square(180), 180, 180, false))
  out('icon-192.png', await shot(disc(192), 192, 192, true))
  out('icon-512.png', await shot(disc(512), 512, 512, true))
  out('icon-maskable-512.png', await shot(square(512), 512, 512, false))
  out(
    'og-image.png',
    await shot(
      `<div style="width:1200px;height:630px;background:${primary};color:${foreground};font-family:system-ui,sans-serif;display:flex;align-items:center;gap:56px;padding:0 96px;box-sizing:border-box">
         <div style="flex:none">${disc(220, true)}</div>
         <div><div style="font-size:84px;font-weight:800;letter-spacing:-2px">${messages.brand_name}</div>
         <div style="font-size:40px;margin-top:16px;max-width:720px;line-height:1.25;opacity:.85">${messages.site_description}</div></div>
       </div>`,
      1200,
      630,
      false,
    ),
  )

  await browser.close()
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main()
}
