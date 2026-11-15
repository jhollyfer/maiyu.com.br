import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  checkDir,
  checkSource,
  describe as describeProblem,
  fixSource,
  loadPatches,
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

  it('every entry of ui-patches.json is well formed', () => {
    for (const patch of loadPatches()) {
      expect(patch.file).toMatch(/^[a-z-]+\.tsx$/)
      expect(() => new RegExp(patch.anchor)).not.toThrow()
      expect(patch.add.length).toBeGreaterThan(0)
      expect(patch.reason.length).toBeGreaterThan(0)
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
