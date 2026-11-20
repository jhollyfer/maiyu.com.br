import { ESLint, Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Strict shadcn over Base UI (_standards/frontend.md §6, DECISIONS.md #366 and #806): the ban on a
 * hand-written interactive element lives in `eslint.config.js` (`RAW_INTERACTIVE`). This suite holds
 * it to two things: where it applies (every `.tsx` of the app but `components/ui/`, the registry's
 * output, and the tests) and what it reports (the elements, the `<a>` that acts, the roles).
 */
const Restricted = z.object({
  rules: z.object({
    'no-restricted-syntax': z
      .tuple([z.union([z.string(), z.number()])])
      .rest(z.object({ selector: z.string(), message: z.string() })),
  }),
})

const eslint = new ESLint({ overrideConfigFile: 'eslint.config.js' })

/** The `no-restricted-syntax` options the project's config applies to `path`. */
async function restrictedFor(path: string) {
  const config: unknown = await eslint.calculateConfigForFile(path)
  return Restricted.parse(config).rules['no-restricted-syntax']
}

/** What the raw-element ban reports on `code` written in `path`, one message per hit. */
async function rawHits(code: string, path = 'src/routes/page.tsx') {
  const [, ...selectors] = await restrictedFor(path)
  const linter = new Linter()
  const messages = linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        languageOptions: { parser: tseslint.parser },
        rules: { 'no-restricted-syntax': ['error', ...selectors] },
      },
    ],
    { filename: path },
  )
  return messages
    .filter((each) => !each.message.startsWith('Colaborador'))
    .map((each) => each.message)
}

describe('RAW_INTERACTIVE: where it applies', () => {
  it.each([
    'src/routes/index.tsx',
    'src/routes/_panel/users/-components/user-form.tsx',
    'src/components/common/table/table-grid.tsx',
    'src/components/home/hero.tsx',
    'src/integrations/theme/theme-toggle.tsx',
    'src/lib/render-thing.tsx',
  ])('charges %s', async (path) => {
    expect((await restrictedFor(path)).length).toBeGreaterThan(2)
  })

  it.each([
    'src/components/ui/button.tsx',
    'src/lib/highlighter.tsx',
    'src/components/common/field/field.test.tsx',
  ])(
    'leaves %s out: the native element lives there, or it is a fixture',
    async (path) => {
      expect(await restrictedFor(path)).toHaveLength(2)
    },
  )
})

describe('RAW_INTERACTIVE: elements with a pair in the registry', () => {
  it.each([
    'button',
    'select',
    'textarea',
    'label',
    'table',
    'dialog',
    'form',
    'progress',
    'hr',
    'details',
    'summary',
    'fieldset',
    'legend',
    'kbd',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
  ])('reports <%s>', async (tag) => {
    expect(
      await rawHits(`export const A = () => <${tag}>x</${tag}>`),
    ).toHaveLength(1)
  })

  it('reports an <input>, but not the hidden file input behind a Button', async () => {
    expect(
      await rawHits('export const A = () => <input type="text" />'),
    ).toHaveLength(1)
    expect(
      await rawHits('export const A = () => <input type="file" hidden />'),
    ).toEqual([])
  })

  it('does not report the element given to a Base UI render prop', async () => {
    expect(
      await rawHits(
        'export const A = () => <Switch render={<button type="button" />} />',
      ),
    ).toEqual([])
  })

  it('does not report structure or the registry components', async () => {
    const code = `export const A = () => (
      <section><nav><ul><li><h1>t</h1><p>x</p><span>y</span></li></ul></nav><Button>ok</Button><Table><TableRow /></Table></section>
    )`

    expect(await rawHits(code)).toEqual([])
  })
})

describe('RAW_INTERACTIVE: <a> that acts', () => {
  it('reports an <a> with onClick and no href', async () => {
    expect(
      await rawHits('export const A = () => <a onClick={go}>x</a>'),
    ).toHaveLength(1)
  })

  it('does not report a link with href, with or without onClick', async () => {
    expect(await rawHits('export const A = () => <a href="/x">x</a>')).toEqual(
      [],
    )
    expect(
      await rawHits('export const A = () => <a href="/x" onClick={log}>x</a>'),
    ).toEqual([])
  })
})

describe('RAW_INTERACTIVE: roles with a pair in the registry', () => {
  it.each([
    'button',
    'checkbox',
    'radio',
    'radiogroup',
    'switch',
    'slider',
    'tab',
    'tablist',
    'tabpanel',
    'dialog',
    'alertdialog',
    'menu',
    'menubar',
    'menuitem',
    'tooltip',
    'progressbar',
    'separator',
    'combobox',
    'listbox',
    'option',
    'alert',
  ])('reports a <div role="%s">', async (role) => {
    expect(
      await rawHits(`export const A = () => <div role="${role}">x</div>`),
    ).toHaveLength(1)
  })

  it.each([
    'status',
    'list',
    'region',
    'group',
    'presentation',
    'navigation',
    'heading',
  ])(
    'does not report role="%s": a live region or a landmark, not a widget of the registry',
    async (role) => {
      expect(
        await rawHits(`export const A = () => <div role="${role}">x</div>`),
      ).toEqual([])
    },
  )

  it('does not report a component that receives a role', async () => {
    expect(
      await rawHits(
        'export const A = () => <CardDescription role="alert">x</CardDescription>',
      ),
    ).toEqual([])
  })
})
