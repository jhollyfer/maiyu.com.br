import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  describe as describeProblem,
  dropUnusedReact,
  houseCn,
  housePackage,
  installMissing,
  installNames,
  loadManifest,
  missingFiles,
  registryDrift,
  restore,
  snapshot,
  undeclaredImports,
} from './check-ui-components.mjs'

/**
 * Strict shadcn over Base UI needs the whole registry installed (_standards/frontend.md §6,
 * DECISIONS.md #366 and #806): a component that is not in `components/ui/` is one a screen writes by
 * hand. The list is `ui-components.json`; this suite holds the checker to it and then runs it on the
 * project's own `src/`, so the unit gate of every commit refuses an incomplete `ui/`.
 */
const MANIFEST = {
  registry: 'base-mira',
  source: 'https://ui.shadcn.com/r/styles/base-mira/registry.json',
  components: ['button', 'dialog', 'sidebar'],
  support: [{ file: 'hooks/use-mobile.ts', item: 'use-mobile' }],
  excluded: {},
}

const Dependencies = z.object({
  dependencies: z.record(z.string(), z.string()),
})

const made: string[] = []

/** A `src/` holding exactly `files`. */
function makeSrc(files: string[]) {
  const src = mkdtempSync(join(tmpdir(), 'ui-components-'))
  made.push(src)
  for (const file of files) {
    mkdirSync(dirname(join(src, file)), { recursive: true })
    writeFileSync(join(src, file), '')
  }
  return src
}

const COMPLETE = [
  'components/ui/button.tsx',
  'components/ui/dialog.tsx',
  'components/ui/sidebar.tsx',
  'hooks/use-mobile.ts',
]

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true })
})

describe('check-ui-components', () => {
  it('passes a src with every component and support file', () => {
    expect(missingFiles(makeSrc(COMPLETE), MANIFEST)).toEqual([])
  })

  it('refuses a missing component, naming the file and the registry name', () => {
    const src = makeSrc(COMPLETE.filter((each) => !each.includes('dialog')))

    const missing = missingFiles(src, MANIFEST)

    expect(missing).toEqual([
      { file: 'components/ui/dialog.tsx', item: 'dialog' },
    ])
    expect(missing.map(describeProblem)).toEqual([
      expect.stringContaining(
        'falta components/ui/dialog.tsx (shadcn add dialog)',
      ),
    ])
  })

  it('refuses a missing support file, which the registry installs with its component', () => {
    const src = makeSrc(COMPLETE.filter((each) => !each.startsWith('hooks/')))

    expect(missingFiles(src, MANIFEST).map((each) => each.item)).toEqual([
      'use-mobile',
    ])
  })

  it('refuses an empty src, listing every file', () => {
    expect(missingFiles(makeSrc([]), MANIFEST)).toHaveLength(4)
  })

  it('does not take a test file for the component', () => {
    const src = makeSrc([
      ...COMPLETE.filter((each) => !each.includes('button')),
      'components/ui/button.test.tsx',
    ])

    expect(missingFiles(src, MANIFEST).map((each) => each.item)).toEqual([
      'button',
    ])
  })

  it('installs the names once, so two files of one item run one add', () => {
    expect(
      installNames([
        { file: 'hooks/use-highlighted-code.ts', item: 'use-highlighted-code' },
        { file: 'lib/highlighter.tsx', item: 'use-highlighted-code' },
        { file: 'components/ui/dialog.tsx', item: 'dialog' },
      ]),
    ).toEqual(['use-highlighted-code', 'dialog'])
  })

  it('--fix runs the CLI for the missing names only, with --yes and --overwrite', () => {
    const src = makeSrc(COMPLETE.filter((each) => !each.includes('dialog')))
    const calls: { command: string; args: string[]; cwd: string }[] = []

    const code = installMissing(
      src,
      missingFiles(src, MANIFEST),
      (command, args, cwd) => {
        calls.push({ command, args, cwd })
        return 0
      },
    )

    expect(code).toBe(0)
    expect(calls).toEqual([
      {
        command: 'pnpm',
        args: ['dlx', 'shadcn@latest', 'add', 'dialog', '--yes', '--overwrite'],
        cwd: join(src, '..'),
      },
    ])
  })

  it('--fix starts nothing when the src is complete', () => {
    const src = makeSrc(COMPLETE)
    let started = 0

    installMissing(src, missingFiles(src, MANIFEST), () => {
      started += 1
      return 0
    })

    expect(started).toBe(0)
  })

  it('--fix puts back every file the project had, so --overwrite never costs a // casa: line', () => {
    const src = makeSrc(COMPLETE.filter((each) => !each.includes('dialog')))
    const button = join(src, 'components/ui/button.tsx')
    writeFileSync(button, '// casa: mine\n')

    installMissing(src, missingFiles(src, MANIFEST), () => {
      writeFileSync(button, 'registry text\n')
      writeFileSync(join(src, 'components/ui/dialog.tsx'), 'new\n')
      return 0
    })

    expect(readFileSync(button, 'utf8')).toBe('// casa: mine\n')
    expect(readFileSync(join(src, 'components/ui/dialog.tsx'), 'utf8')).toBe(
      'new\n',
    )
  })

  it('snapshot and restore round-trip', () => {
    const src = makeSrc(COMPLETE)
    const before = snapshot(src)
    writeFileSync(join(src, 'hooks/use-mobile.ts'), 'changed')

    restore(before)

    expect(readFileSync(join(src, 'hooks/use-mobile.ts'), 'utf8')).toBe('')
  })

  it('brings the registry cn import to the house lib/cn', () => {
    expect(houseCn('import { cn } from "cn"\nimport { x } from \'cn\'')).toBe(
      "import { cn } from '#/lib/cn'\nimport { x } from '#/lib/cn'",
    )
    expect(houseCn("import { cn } from '#/lib/cn'")).toBe(
      "import { cn } from '#/lib/cn'",
    )
  })

  it('drops an `import * as React` nothing reads, and keeps one that is read', () => {
    const unused =
      "'use client'\n\nimport * as React from 'react'\nimport { x } from 'y'\n"
    const used =
      "import * as React from 'react'\nconst a: React.ReactNode = null\n"

    expect(dropUnusedReact(unused)).toBe(
      "'use client'\n\nimport { x } from 'y'\n",
    )
    expect(dropUnusedReact(used)).toBe(used)
  })

  it('drops what the CLI added and kit.deps.json lacks, pins what it has, keeps what the project had', () => {
    const before = JSON.stringify({
      dependencies: { luxon: '3.7.2', clsx: '2.1.1' },
    })
    const after = JSON.stringify({
      dependencies: {
        luxon: '3.7.2',
        clsx: '2.1.1',
        cn: '^0.5.2',
        'date-fns': '^4.4.0',
        cmdk: '^1.1.1',
      },
    })

    const out = Dependencies.parse(
      JSON.parse(housePackage(after, before, { cmdk: '1.1.1', clsx: '2.1.1' })),
    )

    expect(out.dependencies).toEqual({
      luxon: '3.7.2',
      clsx: '2.1.1',
      cmdk: '1.1.1',
    })
  })

  it('keeps a package the project already had even when the kit does not list it', () => {
    const before = JSON.stringify({ dependencies: { 'date-fns': '4.1.0' } })

    expect(
      Dependencies.parse(JSON.parse(housePackage(before, before, {})))
        .dependencies,
    ).toEqual({ 'date-fns': '4.1.0' })
  })

  it('reports a package a component imports that nothing declares', () => {
    const src = makeSrc(['components/ui/.keep'])
    writeFileSync(
      join(src, 'components/ui/x.tsx'),
      "import { a } from 'cmdk'\nimport { b } from '@scope/pkg/sub'\nimport { c } from '#/lib/cn'\nimport { d } from './y'\nimport { e } from 'declared'\n",
    )

    expect(
      undeclaredImports(
        src,
        JSON.stringify({ dependencies: { declared: '1.0.0' } }),
      ),
    ).toEqual(['@scope/pkg', 'cmdk'])
  })

  it("passes the CLI's exit code on", () => {
    const src = makeSrc([])

    expect(installMissing(src, missingFiles(src, MANIFEST), () => 7)).toBe(7)
  })

  it('--registry names what the registry ships and the list lacks, and the reverse', () => {
    const items = [
      { name: 'button', type: 'registry:ui', files: [{}] },
      { name: 'dialog', type: 'registry:ui', files: [{}] },
      { name: 'carousel', type: 'registry:ui', files: [{}] },
      { name: 'form', type: 'registry:ui' },
      { name: 'accordion-demo', type: 'registry:example', files: [{}] },
    ]

    expect(registryDrift(MANIFEST, items)).toEqual({
      missingInList: ['carousel'],
      goneFromRegistry: ['sidebar'],
    })
  })

  it('the list is well formed: sorted, unique, kebab-case, with no empty-registry stub', () => {
    const manifest = loadManifest()

    expect(manifest.components).toEqual([...manifest.components].sort())
    expect(new Set(manifest.components).size).toBe(manifest.components.length)
    for (const name of manifest.components)
      expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/)
    for (const name of Object.keys(manifest.excluded))
      expect(manifest.components).not.toContain(name)
    for (const each of manifest.support)
      expect(each.file).toMatch(/^(hooks|lib)\//)
    expect(manifest.components).toEqual(
      expect.arrayContaining([
        'button',
        'dialog',
        'sheet',
        'sidebar',
        'sonner',
      ]),
    )
  })

  it("the project's components/ui carries every component of the registry", () => {
    const src = fileURLToPath(new URL('../src', import.meta.url))

    expect(missingFiles(src, loadManifest()).map(describeProblem)).toEqual([])
  })
})
