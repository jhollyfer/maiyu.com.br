import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

/**
 * Base UI links the label to the `<span role="radio|checkbox|switch">` only after hydration, so the
 * server HTML had a control with no accessible name (axe `aria-toggle-field-name`, no JS). The
 * `// casa:` patches of `ui-patches.json` (DECISIONS.md #800) point the control at the id its `Label`
 * derives from `htmlFor`; this suite renders on the server, as the SSR does, and proves the name is
 * in the HTML. It reads the project's own `components/ui/`, so it runs where `ui/` exists.
 */
const UI = fileURLToPath(new URL('../src/components/ui/', import.meta.url))
const hasUi = ['radio-group', 'checkbox', 'switch', 'label'].every((name) =>
  existsSync(`${UI}${name}.tsx`),
)

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

describe.skipIf(!hasUi)('accessible name in the server HTML', () => {
  it('the radio is named by its Label', async () => {
    const { Label } = await import('#/components/ui/label')
    const { RadioGroup, RadioGroupItem } =
      await import('#/components/ui/radio-group')
    const html = renderToString(
      createElement(
        RadioGroup,
        null,
        createElement(Label, { htmlFor: 'kind-fire' }, 'Fire'),
        createElement(RadioGroupItem, { id: 'kind-fire', value: 'fire' }),
      ),
    )

    expect(nameOf(html, 'radio')).toEqual({
      labelledBy: 'kind-fire-label',
      resolves: true,
    })
  })

  it('the checkbox is named by its Label', async () => {
    const { Label } = await import('#/components/ui/label')
    const { Checkbox } = await import('#/components/ui/checkbox')
    const html = renderToString(
      createElement(
        'div',
        null,
        createElement(Label, { htmlFor: 'terms' }, 'Terms'),
        createElement(Checkbox, { id: 'terms' }),
      ),
    )

    expect(nameOf(html, 'checkbox')).toEqual({
      labelledBy: 'terms-label',
      resolves: true,
    })
  })

  it('the switch is named by its Label', async () => {
    const { Label } = await import('#/components/ui/label')
    const { Switch } = await import('#/components/ui/switch')
    const html = renderToString(
      createElement(
        'div',
        null,
        createElement(Label, { htmlFor: 'notify' }, 'Notify'),
        createElement(Switch, { id: 'notify' }),
      ),
    )

    expect(nameOf(html, 'switch')).toEqual({
      labelledBy: 'notify-label',
      resolves: true,
    })
  })

  it('a prop of the caller wins over the default', async () => {
    const { Checkbox } = await import('#/components/ui/checkbox')
    const html = renderToString(
      createElement(Checkbox, {
        id: 'terms',
        'aria-labelledby': 'my-title',
      }),
    )

    expect(nameOf(html, 'checkbox').labelledBy).toBe('my-title')
  })
})
