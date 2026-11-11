/**
 * Gera os ícones de `public/` a partir de `public/favicon.svg`.
 *
 * Um script e não uma linha de comentário como a do `og.png`: são quatro
 * arquivos, e um deles é `.ico`, que o sharp não escreve - o formato precisa ser
 * montado à mão. Quando o logo mudar, o comando é um só:
 *
 *   node scripts/generate-icons.mjs
 *
 * Os binários ficam versionados, como o `og.png` já fica: eles são servidos
 * estaticamente e o build não os gera.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')
// O `og:image` do kit (`lib/page-head.ts`) importa `assets/brand/logo-512.png`, e o bundler dá
// a ele o endereço com hash; é o mesmo desenho do ícone de 512 do manifesto.
const BRAND = join(ROOT, 'src', 'assets', 'brand')
const SOURCE = join(PUBLIC, 'favicon.svg')

/**
 * `density` alto na leitura do SVG: o sharp rasteriza o vetor na densidade
 * pedida antes de redimensionar, e no padrão (72dpi) um SVG de 64px vira um
 * bitmap de 64px que depois é **ampliado** para 512 - o ícone sai borrado.
 */
function render(size) {
  return sharp(SOURCE, { density: 384 }).resize(size, size).png()
}

/**
 * Empacota um PNG num `.ico` de uma imagem só.
 *
 * O formato aceita PNG embutido desde o Vista, e é o que todo navegador que
 * ainda pede `/favicon.ico` entende. Escrever o BMP clássico exigiria a máscara
 * AND e a paleta, e nada que peça este arquivo precisa disso.
 *
 * O cabeçalho é fixo: diretório de 6 bytes, uma entrada de 16, e o PNG logo
 * depois - por isso o offset da imagem é 22.
 */
function ico(png, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reservado
  header.writeUInt16LE(1, 2) // 1 = ícone
  header.writeUInt16LE(1, 4) // uma imagem

  const entry = Buffer.alloc(16)
  // 0 significa 256 no formato; 32 cabe num byte e vai literal.
  entry.writeUInt8(size, 0)
  entry.writeUInt8(size, 1)
  entry.writeUInt8(0, 2) // sem paleta
  entry.writeUInt8(0, 3) // reservado
  entry.writeUInt16LE(1, 4) // planos
  entry.writeUInt16LE(32, 6) // bits por pixel
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, png])
}

const targets = [
  // O que o navegador que não lê SVG pede sozinho, por convenção, na raiz.
  { name: 'favicon.ico', size: 32, wrap: ico },
  // O atalho na tela de início do iOS, que ignora o manifesto.
  { name: 'apple-touch-icon.png', size: 180 },
  // Os dois tamanhos que o manifesto declara.
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

// Uma conferência barata: o `.ico` precisa começar pelo diretório de ícone, e
// um erro de offset só apareceria como aba sem ícone meses depois.
const written = await readFile(join(PUBLIC, 'favicon.ico'))
if (written.readUInt16LE(2) !== 1)
  throw new Error('favicon.ico não é um ícone válido')
