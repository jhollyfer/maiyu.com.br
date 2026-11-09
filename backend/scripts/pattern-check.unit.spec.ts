import { test } from '@japa/runner'

import { CheckReport } from './check-report.ts'
import { PatternCheck } from './pattern-check.ts'
import { PatternRules } from './pattern-check.rules.ts'
import type { SourceFile } from './pattern-check.rules.ts'

const run = (files: ReadonlyArray<SourceFile>) => PatternCheck.run({ files, exceptions: [], baseline: [] })
const rules = (files: ReadonlyArray<SourceFile>) => run(files).map((finding) => finding.rule)

test.group('pattern:check > catalog', () => {
  test('every rule has a unique id and points at a section of the standard', ({ assert }) => {
    const ids = PatternRules.CATALOG.map((rule) => rule.id)
    assert.lengthOf(new Set(ids), ids.length)
    for (const rule of PatternRules.CATALOG) assert.match(rule.section, /\.md §?/)
  })

  test('a barrel in app/ or src/ is refused; the shared package entry is not', ({ assert }) => {
    assert.deepEqual(rules([{ path: 'frontend/src/components/common/table/index.ts', text: '' }]), ['index-barrel'])
    assert.deepEqual(rules([{ path: 'shared/src/index.ts', text: '' }]), [])
  })

  test('shared/ importing VineJS is refused', ({ assert }) => {
    assert.deepEqual(rules([{ path: 'shared/src/validator.ts', text: "import vine from '@vinejs/vine'\n" }]), ['shared-no-vine'])
  })

  test('ENV read outside config/ is refused, start/env.ts itself is not', ({ assert }) => {
    const text = "import env from '#start/env'\n"
    assert.deepEqual(rules([{ path: 'backend/app/validators/storages/files.validator.ts', text }]), ['env-outside-config'])
    assert.deepEqual(rules([{ path: 'backend/config/drive.ts', text }]), [])
    assert.deepEqual(rules([{ path: 'backend/start/env.ts', text: 'process.env.PORT\n' }]), [])
  })

  test('a feature importing the global logger is refused', ({ assert }) => {
    const text = "import logger from '@adonisjs/core/services/logger'\n"
    assert.deepEqual(rules([{ path: 'backend/app/features/storages/files/show/show.use-case.ts', text }]), ['request-logger'])
  })

  test('refusal and spec names follow the tree', ({ assert }) => {
    assert.deepEqual(rules([{ path: 'backend/app/features/storages/files/_shared.file-refusals.ts', text: '' }]), ['refusal-name'])
    assert.deepEqual(rules([{ path: 'backend/app/features/_shared.refusal.base.ts', text: '' }]), [])
    assert.deepEqual(rules([{ path: 'backend/app/domain/user/user.entity.unit.spec.ts', text: '' }]), ['spec-name'])
    assert.deepEqual(rules([{ path: 'backend/app/domain/user/user.unit.spec.ts', text: '' }]), [])
  })

  test('route names are <module>.<resource>.<action>', ({ assert }) => {
    const text = "router.get('/a', A).as('administrator.posts.show')\nrouter.get('/b', B).as('posts_show')\n"
    const findings = run([{ path: 'backend/start/routes.ts', text }])
    assert.deepEqual(findings.map((f) => [f.rule, f.line]), [['route-name', 2]])
  })

  test('database config without disableRollbacksInProduction is refused', ({ assert }) => {
    assert.deepEqual(rules([{ path: 'backend/config/database.ts', text: 'migrations: {}\n' }]), ['rollbacks-in-production'])
    assert.deepEqual(rules([{ path: 'backend/config/database.ts', text: 'disableRollbacksInProduction: true\n' }]), [])
  })

  test('OrFail and impure _shared are refused', ({ assert }) => {
    assert.deepEqual(rules([{ path: 'backend/app/repositories/post/post.lucid.repository.ts', text: 'await Post.findOrFail(id)\n' }]), ['or-fail'])
    assert.deepEqual(rules([{ path: 'backend/app/features/_shared.sort.ts', text: "import Post from '#models/post'\n" }]), ['shared-impure'])
    assert.deepEqual(rules([{ path: 'backend/app/features/_shared.sort.ts', text: "import type Post from '#models/post'\n" }]), [])
  })

  test('frontend rules: common prefix, kit import, exact query version, boolean layout prop', ({ assert }) => {
    assert.deepEqual(rules([{ path: 'frontend/src/routes/_private/home.tsx', text: 'm.common_save()\n' }]), ['common-prefix'])
    assert.deepEqual(rules([{ path: 'frontend/src/components/common/table/table.tsx', text: 'm.common_save()\n' }]), [])
    assert.deepEqual(rules([{ path: 'frontend/src/components/common/table/table.tsx', text: "import { x } from '#/mutations/posts'\n" }]), ['kit-import'])
    assert.deepEqual(rules([{ path: 'frontend/package.json', text: '"@tanstack/react-query": "^5.90.0"\n' }]), ['query-exact-version'])
    assert.deepEqual(rules([{ path: 'frontend/package.json', text: '"@tanstack/react-query": "5.90.0"\n' }]), [])
    assert.deepEqual(rules([{ path: 'frontend/src/components/common/page-shell/page-shell.tsx', text: '  borderBottom?: boolean\n' }]), ['boolean-layout-prop'])
  })

  test('a native interactive element outside components/ui/ is refused', ({ assert }) => {
    const lines = (path: string, text: string) =>
      run([{ path, text }]).filter((f) => f.rule === 'raw-interactive-element').map((f) => f.line)
    const screen = 'frontend/src/routes/_private/posts/index.lazy.tsx'
    assert.deepEqual(lines(screen, '<div>\n  <button type="button">x</button>\n  <hr />\n</div>\n'), [2, 3])
    assert.deepEqual(lines(screen, '<Button>x</Button>\n<Input />\n<Label />\n'), [])
    assert.deepEqual(lines(screen, '<input\n  id="a"\n  type="file"\n/>\n<input name="b" />\n'), [5])
    assert.deepEqual(lines(screen, '/** a `<button>` in prose */\n// <form> here\n{/* <table> */}\n'), [])
    const disabled = '{/* eslint-disable-next-line no-restricted-syntax -- the single form */}\n<form method="post">\n'
    assert.deepEqual(lines('frontend/src/components/common/form-shell/form-shell-content.tsx', disabled), [])
    assert.deepEqual(lines('frontend/src/components/ui/button.tsx', '<button />\n'), [])
    assert.deepEqual(lines('frontend/src/components/common/table/table.test.tsx', '<button />\n'), [])
  })
})

test.group('pattern:check > exceptions and baseline', () => {
  const file = { path: 'backend/app/repositories/post/post.lucid.repository.ts', text: 'await Post.findOrFail(id)\n' }

  test('an exception with a reason silences its finding', ({ assert }) => {
    const findings = PatternCheck.run({ files: [file], exceptions: [{ rule: 'or-fail', file: file.path, reason: 'seeder only' }], baseline: [] })
    assert.deepEqual(findings, [])
  })

  test('an exception without a reason, or with no finding left, fails', ({ assert }) => {
    const missing = PatternCheck.run({ files: [file], exceptions: [{ rule: 'or-fail', file: file.path, reason: ' ' }], baseline: [] })
    assert.deepEqual(missing.map((f) => f.rule), ['exception-without-reason'])
    const unused = PatternCheck.run({ files: [], exceptions: [{ rule: 'or-fail', file: file.path, reason: 'old' }], baseline: [] })
    assert.deepEqual(unused.map((f) => f.rule), ['unused-exception'])
  })

  test('the baseline only shrinks', ({ assert }) => {
    assert.deepEqual(PatternCheck.run({ files: [file], exceptions: [], baseline: [{ rule: 'or-fail', file: file.path }] }), [])
    const stale = PatternCheck.run({ files: [], exceptions: [], baseline: [{ rule: 'or-fail', file: file.path }] })
    assert.deepEqual(stale.map((f) => f.rule), ['stale-baseline'])
  })

  test('entries from outside are narrowed', ({ assert }) => {
    assert.throws(() => PatternCheck.entries({}))
    assert.throws(() => PatternCheck.entries([{ rule: 1, file: 'a' }]))
    assert.deepEqual(PatternCheck.entries([{ rule: 'or-fail', file: 'a' }]), [{ rule: 'or-fail', file: 'a' }])
  })
})

test.group('check-report', () => {
  test('groups by section and returns the exit code', ({ assert }) => {
    const lines: string[] = []
    const code = CheckReport.print('x', [PatternCheck.meta('a.ts', 'r', 'm')], (line) => lines.push(line))
    assert.equal(code, 1)
    assert.include(lines.join('\n'), 'backend.md §10')
    assert.equal(CheckReport.print('x', [], () => {}), 0)
  })
})
