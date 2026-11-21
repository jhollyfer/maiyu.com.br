import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  checkDir,
  checkSource,
  describe as describeProblem,
  fixSource,
  loadPatches,
  replaceState,
  stringLiterals,
} from './check-ui-patches.mjs'

/**
 * The `// casa:` patches of `components/ui/` were rule only (_standards/frontend.md §6 and §10.2,
 * DECISIONS.md #461), and a project without them shipped 28px controls on the phone. The list lives
 * in `ui-patches.json`; this suite holds the checker to it and then runs it on the project's own
 * `ui/`, so the unit gate of every commit refuses a missing patch.
 */
const BUTTON_PATCH = {
  file: 'button.tsx',
  anchor: '^h-\\d',
  add: ['max-sm:min-h-11'],
  reason: '44px touch target below sm',
}

const ICON_PATCH = {
  file: 'button.tsx',
  anchor: '^size-\\d',
  add: ['max-sm:min-h-11', 'max-sm:min-w-11'],
  reason: '44px touch target below sm',
}

const REGISTRY_BUTTON = `const buttonVariants = cva('inline-flex items-center', {
  variants: {
    size: {
      default:
        "h-7 gap-1 px-2 [&_svg:not([class*='size-'])]:size-3.5",
      icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
    },
  },
})
`

const PATCHED_BUTTON = `const buttonVariants = cva('inline-flex items-center', {
  variants: {
    size: {
      // casa: 44px touch target below sm
      default:
        "h-7 max-sm:min-h-11 gap-1 px-2 [&_svg:not([class*='size-'])]:size-3.5",
      // casa: 44px touch target below sm
      icon: "size-7 max-sm:min-h-11 max-sm:min-w-11 [&_svg:not([class*='size-'])]:size-3.5",
    },
  },
})
`

const NAME_PATCH = {
  file: 'radio-group.tsx',
  element: 'RadioPrimitive.Root',
  attribute: 'aria-labelledby',
  value: 'props.id ? `${props.id}-label` : undefined',
  reason: 'accessible name in the server HTML',
}

const REGISTRY_RADIO = `function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn('size-4', className)}
      {...props}
    />
  )
}
`

const PATCHED_RADIO = `function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      // casa: accessible name in the server HTML
      aria-labelledby={props.id ? \`\${props.id}-label\` : undefined}
      data-slot="radio-group-item"
      className={cn('size-4', className)}
      {...props}
    />
  )
}
`

describe('check-ui-patches', () => {
  it('refuses the registry output without the patch, naming the line and the missing token', () => {
    const problems = checkSource(REGISTRY_BUTTON, 'button.tsx', [BUTTON_PATCH])

    expect(problems).toEqual([
      {
        file: 'button.tsx',
        line: 5,
        missing: ['max-sm:min-h-11'],
        comment: false,
        reason: BUTTON_PATCH.reason,
      },
    ])
    expect(problems.map(describeProblem)[0]).toMatch(
      /^ui-patch: button\.tsx:5: falta "max-sm:min-h-11"; falta a marca \/\/ casa:.*frontend\.md §6 e §10\.2.*ui-patches\.json.*--fix$/,
    )
  })

  it('a class entry with `remove` refuses the registry token and --fix drops it, once', () => {
    const patch = {
      file: 'button.tsx',
      anchor: '^group/button$',
      add: ['touch-manipulation', 'transition-[color,box-shadow]'],
      remove: ['transition-all'],
      reason: 'drop the registry transition',
    }
    const registry = `const v = cva(
  'group/button inline-flex whitespace-nowrap transition-all outline-none',
)
`
    expect(
      checkSource(registry, 'button.tsx', [patch]).map((p) => [
        p.missing,
        p.extra,
      ]),
    ).toEqual([
      [
        ['touch-manipulation', 'transition-[color,box-shadow]'],
        ['transition-all'],
      ],
    ])

    const fixed = fixSource(registry, patch)
    expect(fixed).toContain(
      "'group/button touch-manipulation transition-[color,box-shadow] inline-flex whitespace-nowrap outline-none'",
    )
    expect(fixed).not.toContain('transition-all')
    expect(fixed).toContain('// casa:')
    expect(checkSource(fixed, 'button.tsx', [patch])).toEqual([])
    expect(fixSource(fixed, patch)).toBe(fixed)
    expect(
      checkSource(
        fixed.replace('transition-[color,box-shadow]', 'transition-all'),
        'button.tsx',
        [patch],
      ).map((p) => p.extra),
    ).toEqual([['transition-all']])
  })

  it('passes the patched file', () => {
    expect(
      checkSource(PATCHED_BUTTON, 'button.tsx', [BUTTON_PATCH, ICON_PATCH]),
    ).toEqual([])
  })

  it('refuses one token missing out of two (the icon width)', () => {
    const halfway = PATCHED_BUTTON.replace(' max-sm:min-w-11', '')

    expect(
      checkSource(halfway, 'button.tsx', [ICON_PATCH]).map((p) => p.missing),
    ).toEqual([['max-sm:min-w-11']])
  })

  it('refuses the token without its // casa: mark', () => {
    const unmarked = PATCHED_BUTTON.replaceAll(
      '      // casa: 44px touch target below sm\n',
      '',
    )

    expect(
      checkSource(unmarked, 'button.tsx', [BUTTON_PATCH]).map((p) => p.comment),
    ).toEqual([false])
  })

  it('does not lend the mark of the literal above to the next one', () => {
    const borrowed = PATCHED_BUTTON.replace(
      '      // casa: 44px touch target below sm\n      icon:',
      '      icon:',
    )

    expect(
      checkSource(borrowed, 'button.tsx', [ICON_PATCH]).map((p) => p.comment),
    ).toEqual([false])
  })

  it('takes the mark above the key whose value sits on the next line', () => {
    const aboveKey = PATCHED_BUTTON.replace(
      '      icon: "size-7',
      '      icon:\n        "size-7',
    )

    expect(checkSource(aboveKey, 'button.tsx', [ICON_PATCH])).toEqual([])
  })

  it('takes a mark that runs over two comment lines', () => {
    const twoLines = PATCHED_BUTTON.replace(
      '      // casa: 44px touch target below sm\n      icon:',
      '      // casa: 44px touch target below sm,\n      // dense icon size kept\n      icon:',
    )

    expect(checkSource(twoLines, 'button.tsx', [ICON_PATCH])).toEqual([])
  })

  it('refuses an anchor that matches nothing, instead of passing a registry that changed shape', () => {
    const problems = checkSource(PATCHED_BUTTON, 'button.tsx', [
      { ...BUTTON_PATCH, anchor: '^min-h-\\d' },
    ])

    expect(problems).toHaveLength(1)
    expect(problems[0]?.line).toBe(0)
  })

  it('does not take a variant-prefixed token for the anchor', () => {
    const source = `const icon = "px-2 [&_svg:not([class*='size-'])]:size-3.5"\n`

    expect(
      checkSource(source, 'button.tsx', [ICON_PATCH]).map((p) => p.line),
    ).toEqual([0])
  })

  it('reads past an apostrophe in JSX text', () => {
    const source = `export const A = () => <p className="h-7">It's here</p>\nconst b = 'h-8'\n`

    expect(stringLiterals(source).map((l) => l.text)).toEqual(['h-7', 'h-8'])
  })

  it('--fix applies the patch and is idempotent', () => {
    const once = [BUTTON_PATCH, ICON_PATCH].reduce(fixSource, REGISTRY_BUTTON)
    const twice = [BUTTON_PATCH, ICON_PATCH].reduce(fixSource, once)

    expect(checkSource(once, 'button.tsx', [BUTTON_PATCH, ICON_PATCH])).toEqual(
      [],
    )
    expect(twice).toBe(once)
    expect(once).toContain(
      '"h-7 max-sm:min-h-11 gap-1 px-2 [&_svg:not([class*=\'size-\'])]:size-3.5"',
    )
    expect(once).toContain('"size-7 max-sm:min-h-11 max-sm:min-w-11 [&_svg')
  })

  it('passes the radio with the accessible-name attribute before the spread', () => {
    expect(checkSource(PATCHED_RADIO, 'radio-group.tsx', [NAME_PATCH])).toEqual(
      [],
    )
  })

  it('refuses the radio without the attribute, naming the line and the attribute', () => {
    const problems = checkSource(REGISTRY_RADIO, 'radio-group.tsx', [
      NAME_PATCH,
    ])

    expect(problems).toHaveLength(1)
    expect(problems[0]?.line).toBe(3)
    expect(problems[0]?.comment).toBe(true)
    expect(problems[0]?.missing).toEqual([
      'aria-labelledby={props.id ? `${props.id}-label` : undefined}',
    ])
    expect(problems.map(describeProblem)[0]).toMatch(
      /^ui-patch: radio-group\.tsx:3: falta "aria-labelledby=.*--fix$/,
    )
  })

  it('refuses the attribute after the spread, where the next prop of the caller would lose', () => {
    const after = PATCHED_RADIO.replace(
      /(\s+\/\/ casa:[^\n]*\n\s+aria-labelledby=\{[^\n]*\}\n)([\s\S]*?)(\s+\{\.\.\.props\}\n)/,
      '$2$3$1',
    )

    expect(
      checkSource(after, 'radio-group.tsx', [NAME_PATCH]).map((p) => p.missing),
    ).toEqual([[`aria-labelledby={${NAME_PATCH.value}}`]])
  })

  it('refuses the attribute with another value, or without the // casa: mark', () => {
    const other = PATCHED_RADIO.replace('-label', '-nome')
    const unmarked = PATCHED_RADIO.replace(/\s+\/\/ casa:[^\n]*/, '')

    expect(checkSource(other, 'radio-group.tsx', [NAME_PATCH])).toHaveLength(1)
    expect(
      checkSource(unmarked, 'radio-group.tsx', [NAME_PATCH]).map(
        (p) => p.comment,
      ),
    ).toEqual([false])
  })

  it('refuses a file without the element, instead of passing a registry that changed shape', () => {
    const problems = checkSource('export const A = 1\n', 'radio-group.tsx', [
      NAME_PATCH,
    ])

    expect(problems.map((p) => p.line)).toEqual([0])
  })

  it('--fix inserts the attribute before the spread, replaces a wrong one and is idempotent', () => {
    const once = fixSource(REGISTRY_RADIO, NAME_PATCH)
    const wrong = fixSource(
      PATCHED_RADIO.replace('-label', '-nome'),
      NAME_PATCH,
    )

    expect(checkSource(once, 'radio-group.tsx', [NAME_PATCH])).toEqual([])
    expect(once.indexOf('aria-labelledby')).toBeLessThan(
      once.indexOf('{...props}'),
    )
    expect(fixSource(once, NAME_PATCH)).toBe(once)
    expect(checkSource(wrong, 'radio-group.tsx', [NAME_PATCH])).toEqual([])
    expect(wrong.match(/aria-labelledby/g)).toHaveLength(1)
  })

  it('--fix keeps a comment of someone else above the wrong attribute', () => {
    const foreign = PATCHED_RADIO.replace(
      '      // casa: accessible name in the server HTML\n      aria-labelledby={props.id ? `${props.id}-label` : undefined}',
      '      // keep this one\n      aria-labelledby={props.id}',
    )
    const fixed = fixSource(foreign, NAME_PATCH)

    expect(fixed).toContain('// keep this one')
    expect(fixed.match(/aria-labelledby/g)).toHaveLength(1)
    expect(checkSource(fixed, 'radio-group.tsx', [NAME_PATCH])).toEqual([])
  })

  it('--fix twice on a skeleton Prettier wrapped keeps one mark, and the check passes (DECISIONS.md #815)', () => {
    const patch = {
      file: 'skeleton.tsx',
      anchor: '^animate-pulse$',
      add: ['motion-reduce:animate-none'],
      reason: 'stops pulsing for reduced motion',
    }
    const registry = `<div
  data-slot="skeleton"
  className={cn('animate-pulse rounded-md bg-muted', className)}
/>
`
    // What Prettier makes of the first `--fix`: the line grew past 80 columns, the call broke and
    // the mark stayed above `className=`, two lines away from the literal.
    const wrapped = `<div
  data-slot="skeleton"
  // casa: stops pulsing for reduced motion
  className={cn(
    'animate-pulse motion-reduce:animate-none rounded-md bg-muted',
    className,
  )}
/>
`
    expect(checkSource(wrapped, 'skeleton.tsx', [patch])).toEqual([])
    expect(fixSource(wrapped, patch)).toBe(wrapped)
    expect(
      fixSource(fixSource(registry, patch), patch).match(/casa:/g),
    ).toHaveLength(1)
  })

  it('every entry of ui-patches.json is well formed', () => {
    for (const patch of loadPatches()) {
      expect(patch.file).toMatch(/^[a-z-]+\.tsx$/)
      expect(patch.reason.length).toBeGreaterThan(0)
      if ('element' in patch) {
        expect(patch.element.length).toBeGreaterThan(0)
        expect(patch.attribute).toMatch(/^[a-z-]+$/)
        expect(patch.value.length).toBeGreaterThan(0)
      } else if ('from' in patch) {
        expect(patch.from.length).toBeGreaterThan(0)
        expect(patch.to).toContain('casa:')
        expect(patch.to).not.toBe(patch.from)
      } else {
        expect(() => new RegExp(patch.anchor)).not.toThrow()
        expect(patch.add.length).toBeGreaterThan(0)
      }
    }
  })

  it("the project's components/ui carries every required patch", () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const problems = checkDir(join(root, 'src/components/ui'), loadPatches())
      .map((problem) => ({ ...problem, file: relative(root, problem.file) }))
      .map(describeProblem)

    expect(problems).toEqual([])
  })
})

/**
 * `from` + `to` entries (DECISIONS.md #818): the sentences in English the registry ships become
 * `m.kit_ui_*()`, and the `sonner` loses the `next-themes` hook. A reinstall of the registry
 * (`check-ui-components --fix`) puts them back by itself, so a project never redoes them by hand.
 */
describe('replace patches of ui-patches.json', () => {
  const SONNER_REGISTRY = `import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      {...props}
    />
  )
}
`
  const DIALOG_REGISTRY = `import { cn } from '#/lib/cn'

function Close() {
  return (
    <button>
      <span className="sr-only">Close</span>
    </button>
  )
}
`
  const patchesOf = (file: string) =>
    loadPatches().filter((each) => each.file === file)
  const fixAll = (source: string, file: string) =>
    patchesOf(file).reduce(fixSource, source)

  it('turns the registry sonner into one that takes the theme as a prop, with no next-themes', () => {
    const fixed = fixAll(SONNER_REGISTRY, 'sonner.tsx')

    expect(fixed).not.toContain("from 'next-themes'")
    expect(fixed).not.toContain('useTheme()')
    expect(fixed).toContain('// casa:')
    expect(fixed).toContain('{...props}')
    expect(checkSource(fixed, 'sonner.tsx', patchesOf('sonner.tsx'))).toEqual(
      [],
    )
  })

  it('translates the sr-only label of the Dialog and refuses the English one', () => {
    const patches = patchesOf('dialog.tsx')

    expect(checkSource(DIALOG_REGISTRY, 'dialog.tsx', patches)).toHaveLength(2)
    const fixed = fixAll(DIALOG_REGISTRY, 'dialog.tsx')
    expect(fixed).toContain('{m.kit_ui_close()}')
    expect(fixed).toContain("import { m } from '#/paraglide/messages'")
    expect(checkSource(fixed, 'dialog.tsx', patches)).toEqual([])
  })

  it('is idempotent: a second --fix writes nothing', () => {
    for (const [file, source] of [
      ['sonner.tsx', SONNER_REGISTRY],
      ['dialog.tsx', DIALOG_REGISTRY],
    ] as const) {
      const once = fixAll(source, file)
      expect(fixAll(once, file)).toBe(once)
    }
  })

  it('accepts what Prettier lays out differently', () => {
    const patch = patchesOf('dialog.tsx').find(
      (each) => 'to' in each && each.to.includes('kit_ui_close'),
    )
    if (patch === undefined || !('to' in patch)) throw new Error('no patch')
    const relaid = patch.to
      .replace('\n<span', '\n      <span')
      .replace('>{m', '>\n{m')

    expect(replaceState(`  ${relaid}  `, patch)).toBe('done')
  })

  it('reports a registry that changed shape instead of passing in silence', () => {
    const problems = checkSource(
      'export const x = 1\n',
      'dialog.tsx',
      patchesOf('dialog.tsx'),
    )

    expect(problems.length).toBeGreaterThan(0)
    expect(
      problems.every((each) => each.reason.includes('não está mais')),
    ).toBe(true)
  })

  it('every m.kit_ui_* a patch writes exists in the three kit locales', () => {
    const used = new Set(
      loadPatches()
        .filter(
          (each): each is Extract<typeof each, { to: string }> => 'to' in each,
        )
        .map((each) => each.to)
        .flatMap((text) => text.match(/m\.(kit_[a-z_]+)\(/g) ?? [])
        .map((each) => each.slice(2, -1)),
    )

    expect(used.size).toBeGreaterThan(10)
    for (const locale of ['pt-BR', 'en', 'es']) {
      // No upstream as mensagens do kit ficam em messages/kit/; no projeto o sync as funde em
      // messages/<locale>.json e não copia a pasta kit/.
      let file = new URL(`../messages/kit/${locale}.json`, import.meta.url)
      if (!existsSync(file)) {
        file = new URL(`../messages/${locale}.json`, import.meta.url)
      }
      const messages: unknown = JSON.parse(readFileSync(file, 'utf8'))
      for (const key of used) {
        expect(messages, `${locale}: ${key}`).toHaveProperty([key])
      }
    }
  })
})
