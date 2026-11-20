import { createElement } from 'react'
import type { ElementType } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

/**
 * Base UI links the label to the `<span role="radio|checkbox|switch">` only after hydration, so the
 * server HTML had a control with no accessible name (axe `aria-toggle-field-name`, no JS). The
 * `// casa:` patches of `ui-patches.json` (DECISIONS.md #800) point the control at the id its `Label`
 * derives from `htmlFor`; this suite renders on the server, as the SSR does, and proves the name is
 * in the HTML. It reads the project's own `components/ui/` through `import.meta.glob`
 * (_doc-lib/vitejs.md#features, https://vite.dev/guide/features#glob-import), so a project without
 * one of the files still type-checks and lints: that case is skipped by name, never imported.
 */
const modules = import.meta.glob(
  '../src/components/ui/{radio-group,checkbox,switch,label}.tsx',
)

const CASES = [
  {
    title: 'radio',
    file: 'radio-group',
    group: 'RadioGroup',
    item: 'RadioGroupItem',
    role: 'radio',
    id: 'kind-fire',
  },
  {
    title: 'checkbox',
    file: 'checkbox',
    group: undefined,
    item: 'Checkbox',
    role: 'checkbox',
    id: 'terms',
  },
  {
    title: 'switch',
    file: 'switch',
    group: undefined,
    item: 'Switch',
    role: 'switch',
    id: 'notify',
  },
] as const

/** @param file name of a `components/ui/` file, without the extension */
function has(file: string) {
  return Object.hasOwn(modules, `../src/components/ui/${file}.tsx`)
}

function isComponent(value: unknown): value is ElementType {
  if (typeof value === 'function') return true
  return typeof value === 'object' && value !== null
}

/** The export `name` of `components/ui/<file>.tsx`; the caller checked that the file exists. */
async function component(file: string, name: string): Promise<ElementType> {
  const load = modules[`../src/components/ui/${file}.tsx`]
  if (load === undefined) throw new Error(`components/ui/${file}.tsx missing`)
  const loaded: unknown = await load()
  let value: unknown
  if (typeof loaded === 'object' && loaded !== null) {
    value = Reflect.get(loaded, name)
  }
  if (!isComponent(value)) throw new Error(`${file}: no export ${name}`)
  return value
}

/** The `aria-labelledby` of the control with `role`, and whether an element with that id exists. */
function nameOf(html: string, role: string) {
  const control = new RegExp(`<[^>]*role="${role}"[^>]*>`).exec(html)?.[0] ?? ''
  const labelledBy = /aria-labelledby="([^"]*)"/.exec(control)?.[1]
  return {
    labelledBy,
    resolves:
      labelledBy !== undefined &&
      new RegExp(`<label[^>]*id="${labelledBy}"`).test(html),
  }
}

/** The test title says which file is missing when the case is skipped. */
function titled(title: string, ...files: string[]) {
  const missing = files.filter((file) => !has(file))
  if (missing.length === 0) return title
  return `${title} (skipped: components/ui/${missing.join('.tsx, components/ui/')}.tsx missing)`
}

describe('accessible name in the server HTML', () => {
  for (const each of CASES) {
    const present = has(each.file) && has('label')

    it.skipIf(!present)(
      titled(`the ${each.title} is named by its Label`, each.file, 'label'),
      async () => {
        const Label = await component('label', 'Label')
        const Item = await component(each.file, each.item)
        let root: ElementType = 'div'
        if (each.group !== undefined) {
          root = await component(each.file, each.group)
        }
        const html = renderToString(
          createElement(
            root,
            null,
            createElement(Label, { htmlFor: each.id }, each.title),
            createElement(Item, { id: each.id, value: each.id }),
          ),
        )

        expect(nameOf(html, each.role)).toEqual({
          labelledBy: `${each.id}-label`,
          resolves: true,
        })
      },
    )
  }

  it.skipIf(!has('checkbox'))(
    titled('a prop of the caller wins over the default', 'checkbox'),
    async () => {
      const Checkbox = await component('checkbox', 'Checkbox')
      const html = renderToString(
        createElement(Checkbox, { id: 'terms', 'aria-labelledby': 'my-title' }),
      )

      expect(nameOf(html, 'checkbox').labelledBy).toBe('my-title')
    },
  )
})
