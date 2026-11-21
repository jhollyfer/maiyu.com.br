import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { test } from '@japa/runner'

import { CheckReport } from './check-report.ts'
import { PatternRules } from './pattern-check.rules.ts'
import type { SourceFile } from './pattern-check.rules.ts'
import { PatternCheck } from './pattern-check.ts'

const run = (files: ReadonlyArray<SourceFile>) =>
  PatternCheck.run({ files, exceptions: [], baseline: [] })
const rules = (files: ReadonlyArray<SourceFile>) =>
  run(files).map((finding) => finding.rule)

test.group('pattern:check > catalog', () => {
  test('every rule has a unique id and points at a section of the standard', ({
    assert,
  }) => {
    const ids = PatternRules.CATALOG.map((rule) => rule.id)
    assert.lengthOf(new Set(ids), ids.length)
    for (const rule of PatternRules.CATALOG)
      assert.match(rule.section, /\.md §?/)
  })

  test('a barrel in app/ or src/ is refused; the shared package entry is not', ({
    assert,
  }) => {
    assert.deepEqual(
      rules([
        { path: 'frontend/src/components/common/table/index.ts', text: '' },
      ]),
      ['index-barrel'],
    )
    assert.deepEqual(rules([{ path: 'shared/src/index.ts', text: '' }]), [])
    assert.deepEqual(
      rules([{ path: 'frontend/src/routes/_public/index.tsx', text: '' }]),
      [],
    )
  })

  test('shared/ importing VineJS is refused', ({ assert }) => {
    assert.deepEqual(
      rules([
        {
          path: 'shared/src/validator.ts',
          text: "import vine from '@vinejs/vine'\n",
        },
      ]),
      ['shared-no-vine'],
    )
  })

  test('ENV read outside config/ is refused, start/env.ts itself is not', ({
    assert,
  }) => {
    const text = "import env from '#start/env'\n"
    assert.deepEqual(
      rules([
        { path: 'backend/app/validators/storages/files.validator.ts', text },
      ]),
      ['env-outside-config'],
    )
    assert.deepEqual(rules([{ path: 'backend/config/drive.ts', text }]), [])
    assert.deepEqual(
      rules([{ path: 'backend/start/env.ts', text: 'process.env.PORT\n' }]),
      [],
    )
  })

  test('a feature importing the global logger is refused', ({ assert }) => {
    const text = "import logger from '@adonisjs/core/services/logger'\n"
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/features/storages/files/show/show.use-case.ts',
          text,
        },
      ]),
      ['request-logger'],
    )
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/repositories/session/session.lucid.repository.ts',
          text,
        },
      ]),
      ['request-logger'],
    )
  })

  test('refusal and spec names follow the tree', ({ assert }) => {
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/features/storages/files/_shared.file-refusals.ts',
          text: '',
        },
      ]),
      ['refusal-name'],
    )
    assert.deepEqual(
      rules([
        { path: 'backend/app/features/_shared.refusal.base.ts', text: '' },
      ]),
      [],
    )
    assert.deepEqual(
      rules([
        { path: 'backend/app/domain/user/user.entity.unit.spec.ts', text: '' },
      ]),
      ['spec-name'],
    )
    assert.deepEqual(
      rules([{ path: 'backend/app/domain/user/user.unit.spec.ts', text: '' }]),
      [],
    )
  })

  test('route names are <module>.<resource>.<action>', ({ assert }) => {
    const text =
      "router.get('/a', A).as('administrator.posts.show')\nrouter.get('/b', B).as('posts_show')\n"
    const findings = run([{ path: 'backend/start/routes.ts', text }])
    assert.deepEqual(
      findings.map((f) => [f.rule, f.line]),
      [['route-name', 2]],
    )
  })

  test('database config without disableRollbacksInProduction is refused', ({
    assert,
  }) => {
    assert.deepEqual(
      rules([{ path: 'backend/config/database.ts', text: 'migrations: {}\n' }]),
      ['rollbacks-in-production'],
    )
    assert.deepEqual(
      rules([
        {
          path: 'backend/config/database.ts',
          text: 'disableRollbacksInProduction: true\n',
        },
      ]),
      [],
    )
  })

  test('OrFail and impure _shared are refused', ({ assert }) => {
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/repositories/post/post.lucid.repository.ts',
          text: 'await Post.findOrFail(id)\n',
        },
      ]),
      ['or-fail'],
    )
    // The auth API the doc asks for, in a guard and in a use-case, is not an ORM throw.
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/guards/cookie-access-tokens.guard.ts',
          text: 'getUserOrFail(): GuardUser {\n  return this.getUserOrFail()\n',
        },
      ]),
      [],
    )
    // The request logger the standard asks for (backend.md §4.2) is not an ORM throw.
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/features/posts/show/show.use-case.ts',
          text: "HttpContext.getOrFail().logger.error({ err: error }, 'x')\n",
        },
      ]),
      [],
    )
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/features/_shared.sort.ts',
          text: "import Post from '#models/post'\n",
        },
      ]),
      ['shared-impure'],
    )
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/features/_shared.sort.ts',
          text: "import type Post from '#models/post'\n",
        },
      ]),
      [],
    )
  })

  test('frontend rules: common prefix, kit import, exact query version, boolean layout prop', ({
    assert,
  }) => {
    assert.deepEqual(
      rules([
        {
          path: 'frontend/src/routes/_private/home.tsx',
          text: 'm.common_save()\n',
        },
      ]),
      ['common-prefix'],
    )
    assert.deepEqual(
      rules([
        {
          path: 'frontend/src/components/common/table/table.tsx',
          text: 'm.common_save()\n',
        },
      ]),
      [],
    )
    assert.deepEqual(
      rules([
        {
          path: 'frontend/src/components/common/table/table.tsx',
          text: "import { x } from '#/mutations/posts'\n",
        },
      ]),
      ['kit-import'],
    )
    assert.deepEqual(
      rules([
        {
          path: 'frontend/package.json',
          text: '"@tanstack/react-query": "^5.90.0"\n',
        },
      ]),
      ['query-exact-version'],
    )
    assert.deepEqual(
      rules([
        {
          path: 'frontend/package.json',
          text: '"@tanstack/react-query": "5.90.0"\n',
        },
      ]),
      [],
    )
    assert.deepEqual(
      rules([
        {
          path: 'frontend/src/components/common/page-shell/page-shell.tsx',
          text: '  borderBottom?: boolean\n',
        },
      ]),
      ['boolean-layout-prop'],
    )
  })

  test('a vine.string() without trim is refused; password, uuid and a trimmed chain are not', ({
    assert,
  }) => {
    const file = (text: string): SourceFile => ({
      path: 'backend/app/validators/posts/posts.validator.ts',
      text,
    })
    assert.deepEqual(
      rules([
        file(
          'export const V = vine.create({\n  title: vine.string().maxLength(100),\n})',
        ),
      ]),
      ['vine-string-trim'],
    )
    assert.deepEqual(
      rules([
        file(
          'export const V = vine.create({\n  title: vine\n    .string()\n    .minLength(1)\n    .maxLength(100),\n})',
        ),
      ]),
      ['vine-string-trim'],
    )
    assert.deepEqual(
      rules([
        file(
          'export const V = vine.create({\n  title: vine\n    .string()\n    .trim()\n    .maxLength(100),\n  id: vine.string().uuid(),\n  password: vine.string().minLength(8).maxLength(32),\n  currentPassword: vine.string().minLength(1),\n  passwordConfirmation: vine.string(),\n})',
        ),
      ]),
      [],
    )
    assert.deepEqual(
      rules([
        {
          path: 'backend/app/core/validator.ts',
          text: 'class Rule {\n  static password() {\n    return vine.string().minLength(8)\n  }\n  static search() {\n    return vine.string().maxLength(100)\n  }\n}',
        },
      ]),
      ['vine-string-trim'],
    )
    assert.deepEqual(
      PatternRules.untrimmedStrings(
        'class Rule {\n  static password() {\n    return vine.string().minLength(8)\n  }\n  static search() {\n    return vine.string().maxLength(100)\n  }\n}',
      ),
      [6],
    )
  })

  test('a link given to a render prop to look like a button is refused: Link plus buttonVariants', ({
    assert,
  }) => {
    const lines = (path: string, text: string) =>
      run([{ path, text }])
        .filter((f) => f.rule === 'link-as-button')
        .map((f) => f.line)
    const screen = 'frontend/src/routes/_private/posts/index.lazy.tsx'

    assert.deepEqual(
      lines(screen, '<Button render={<Link to="/x" />}>Novo</Button>\n'),
      [1],
    )
    // The element on the line after `render={`, the form Prettier writes.
    assert.deepEqual(
      lines(
        'frontend/src/components/common/table/table-header.tsx',
        '<Button\n  render={\n    <Link to={to}>\n      <PlusIcon />\n    </Link>\n  }\n/>\n',
      ),
      [2],
    )
    assert.deepEqual(
      lines(screen, '<Button render={<a href="/x" />}>x</Button>\n'),
      [1],
    )
    // The right way, a comment that names the forbidden form, a spec, and a Link with a reason.
    assert.deepEqual(
      lines(screen, '<Link to="/x" className={buttonVariants()}>Novo</Link>\n'),
      [],
    )
    assert.deepEqual(
      lines(
        screen,
        '// never `<Button render={<Link />}>`\n/* render={<Link /> */\n',
      ),
      [],
    )
    assert.deepEqual(
      lines(
        'frontend/src/routes/x.test.tsx',
        '<Button render={<Link to="/x" />} />\n',
      ),
      [],
    )
    assert.deepEqual(
      lines(
        screen,
        '// eslint-disable-next-line no-restricted-syntax -- a menu item that navigates\n<MenuItem render={<Link to="/x" />} />\n',
      ),
      [],
    )
    // The owner is the exact `Button`, found past the JSX an attribute holds.
    assert.deepEqual(
      lines(screen, '<Button icon={<X />} render={<Link to="/x" />} />\n'),
      [1],
    )
    assert.deepEqual(
      lines(
        screen,
        '<SheetClose nativeButton={false} render={<Link to="/x" />} />\n',
      ),
      [],
    )
    assert.deepEqual(
      lines(
        screen,
        '<SidebarMenuButton render={<Link to="/x" />}>x</SidebarMenuButton>\n',
      ),
      [],
    )
    // A `render` of another element is not a link as a button.
    assert.deepEqual(
      lines(screen, '<Switch render={<button type="button" />} />\n'),
      [],
    )
  })

  test('a native interactive element outside components/ui/ is refused', ({
    assert,
  }) => {
    const lines = (path: string, text: string) =>
      run([{ path, text }])
        .filter((f) => f.rule === 'raw-interactive-element')
        .map((f) => f.line)
    const screen = 'frontend/src/routes/_private/posts/index.lazy.tsx'
    assert.deepEqual(
      lines(
        screen,
        '<div>\n  <button type="button">x</button>\n  <hr />\n</div>\n',
      ),
      [2, 3],
    )
    assert.deepEqual(
      lines(screen, '<Button>x</Button>\n<Input />\n<Label />\n'),
      [],
    )
    assert.deepEqual(
      lines(
        screen,
        '<Switch nativeButton render={<button type="button" />} />\n',
      ),
      [],
    )
    assert.deepEqual(
      lines(
        screen,
        '<input\n  id="a"\n  type="file"\n/>\n<input name="b" />\n',
      ),
      [5],
    )
    assert.deepEqual(
      lines(
        screen,
        '/** a `<button>` in prose */\n// <form> here\n{/* <table> */}\n',
      ),
      [],
    )
    const disabled =
      '{/* eslint-disable-next-line no-restricted-syntax -- the single form */}\n<form method="post">\n'
    assert.deepEqual(
      lines(
        'frontend/src/components/common/form-shell/form-shell-content.tsx',
        disabled,
      ),
      [],
    )
    assert.deepEqual(
      lines('frontend/src/components/ui/button.tsx', '<button />\n'),
      [],
    )
    assert.deepEqual(
      lines(
        'frontend/src/components/common/table/table.test.tsx',
        '<button />\n',
      ),
      [],
    )
  })
})

test.group('pattern:check > minio outside local', () => {
  const lines = (files: ReadonlyArray<SourceFile>) =>
    run(files).map((finding) => [finding.file, finding.rule, finding.line])

  test('code, JSON and a production Dockerfile naming MinIO are refused', ({
    assert,
  }) => {
    assert.deepEqual(
      lines([
        {
          path: 'backend/config/drive.ts',
          text: "const a = 1\nconst endpoint = 'http://minio:9000'\n",
        },
        {
          path: 'backend/start/env.ts',
          text: 'MINIO_ENDPOINT: Env.schema.string(),\n',
        },
        {
          path: 'frontend/src/lib/storage.ts',
          text: "const host = 'minio.local' // the bucket\n",
        },
        { path: 'backend/package.json', text: '{ "minio": "8.0.0" }\n' },
        {
          path: 'backend/Dockerfile-production',
          text: 'FROM node:24\n# no MinIO here\n',
        },
      ]),
      [
        ['backend/config/drive.ts', 'minio-outside-local', 2],
        ['backend/start/env.ts', 'minio-outside-local', 1],
        ['frontend/src/lib/storage.ts', 'minio-outside-local', 1],
        ['backend/package.json', 'minio-outside-local', 1],
        ['backend/Dockerfile-production', 'minio-outside-local', 2],
      ],
    )
  })

  test('a word that only contains the letters is not a mention', ({
    assert,
  }) => {
    const text = [
      "const es = 'dominio del cuerpo'",
      "const pt = 'domínio do condomínio'",
      "const title = 'Dominio y CONDOMINIO'",
    ].join('\n')
    assert.deepEqual(rules([{ path: 'frontend/src/lib/items.ts', text }]), [])
  })

  test('a comment about the local environment is not refused', ({ assert }) => {
    const text = [
      '/**',
      ' * One S3-compatible bucket, MinIO in dev and in the e2e.',
      ' */',
      '// and talks to Postgres and MinIO',
      "const disk = 's3' // MinIO locally, R2 in production",
      '/* MinIO swaps with S3 by STORAGE_ENDPOINT */',
    ].join('\n')
    assert.deepEqual(rules([{ path: 'backend/config/drive.ts', text }]), [])
  })

  test('where MinIO lives, specs, tests and scripts are out of the rule', ({
    assert,
  }) => {
    const text = "const endpoint = 'http://minio:9000'\n"
    assert.deepEqual(
      rules(
        [
          'backend/docker-compose.yml',
          'backend/infra/minio/minio-setup.ts',
          'backend/app/services/multipart/multipart.e2e.spec.ts',
          'backend/tests/bootstrap.ts',
          'backend/scripts/pattern-check.rules.ts',
          'frontend/e2e/upload.spec.ts',
          'frontend/src/components/common/upload/upload.test.tsx',
        ].map((path) => ({ path, text })),
      ),
      [],
    )
  })
})

test.group('pattern:check > exceptions and baseline', () => {
  const file = {
    path: 'backend/app/repositories/post/post.lucid.repository.ts',
    text: 'await Post.findOrFail(id)\n',
  }

  test('an exception with a reason silences its finding', ({ assert }) => {
    const findings = PatternCheck.run({
      files: [file],
      exceptions: [{ rule: 'or-fail', file: file.path, reason: 'seeder only' }],
      baseline: [],
    })
    assert.deepEqual(findings, [])
  })

  test('an exception without a reason, or with no finding left, fails', ({
    assert,
  }) => {
    const missing = PatternCheck.run({
      files: [file],
      exceptions: [{ rule: 'or-fail', file: file.path, reason: ' ' }],
      baseline: [],
    })
    assert.deepEqual(
      missing.map((f) => f.rule),
      ['exception-without-reason'],
    )
    const unused = PatternCheck.run({
      files: [],
      exceptions: [{ rule: 'or-fail', file: file.path, reason: 'old' }],
      baseline: [],
    })
    assert.deepEqual(
      unused.map((f) => f.rule),
      ['unused-exception'],
    )
  })

  test('the baseline only shrinks', ({ assert }) => {
    assert.deepEqual(
      PatternCheck.run({
        files: [file],
        exceptions: [],
        baseline: [{ rule: 'or-fail', file: file.path }],
      }),
      [],
    )
    const stale = PatternCheck.run({
      files: [],
      exceptions: [],
      baseline: [{ rule: 'or-fail', file: file.path }],
    })
    assert.deepEqual(
      stale.map((f) => f.rule),
      ['stale-baseline'],
    )
  })

  test('entries from outside are narrowed', ({ assert }) => {
    assert.throws(() => PatternCheck.entries({}))
    assert.throws(() => PatternCheck.entries([{ rule: 1, file: 'a' }]))
    assert.deepEqual(PatternCheck.entries([{ rule: 'or-fail', file: 'a' }]), [
      { rule: 'or-fail', file: 'a' },
    ])
  })
})

test.group('pattern:check > public sign-up minimum (DECISIONS.md #799)', () => {
  const path = 'backend/app/validators/authentication/sign-up.validator.ts'
  const validator = (fields: string) => ({
    path,
    text: [
      "import { vine } from '#core/validator'",
      '',
      'export const AuthenticationSignUpValidator = vine.create({',
      fields,
      '',
      'export const AuthenticationSignInValidator = vine.create({',
      '  phone: vine.string().trim(),',
      '})',
    ].join('\n'),
  })
  const check = (file: SourceFile, signupValidators: ReadonlyArray<string>) =>
    PatternCheck.run({
      files: [file],
      exceptions: [],
      baseline: [],
      signupValidators,
    })

  test('a sign-up with only the minimum passes', ({ assert }) => {
    const file = validator(
      [
        '  name: vine.string().trim(),',
        '  email: vine.string().trim().email(),',
        '  password: Rule.password(),',
        '  storeName: vine.string().trim(),',
        '  cityId: vine.string().uuid(),',
        '  acceptTerms: vine.boolean(),',
        '})',
      ].join('\n'),
    )

    assert.deepEqual(check(file, ['AuthenticationSignUpValidator']), [])
  })

  test('a sensitive field in the listed sign-up is refused, at the line of the field', ({
    assert,
  }) => {
    const file = validator(
      [
        '  name: vine.string().trim(),',
        '  cpf: vine.string().trim(),',
        '  profile: vine.object({',
        '    pixKey: vine.string().trim(),',
        '    taxId: vine.string().trim(),',
        '    birth_date: vine.string().trim(),',
        '    emailAddress: vine.string().trim(),',
        '  }),',
        '})',
      ].join('\n'),
    )

    const findings = check(file, ['AuthenticationSignUpValidator'])

    assert.deepEqual(
      findings.map((finding) => [finding.rule, finding.line]),
      [
        ['public-signup-minimum', 5],
        ['public-signup-minimum', 7],
        ['public-signup-minimum', 8],
        ['public-signup-minimum', 9],
        ['public-signup-minimum', 10],
      ],
    )
  })

  test('phone next to the e-mail passes too', ({ assert }) => {
    const file = validator(
      [
        '  name: vine.string().trim(),',
        '  email: vine.string().trim().email(),',
        '  phone: vine.string().trim(),',
        '  password: Rule.password(),',
        '})',
      ].join('\n'),
    )

    assert.deepEqual(check(file, ['AuthenticationSignUpValidator']), [])
  })

  test('phone alone passes: the login is e-mail and/or phone, at least one of the two', ({
    assert,
  }) => {
    const file = validator(
      [
        '  name: vine.string().trim(),',
        '  phone: vine.string().trim(),',
        '  password: Rule.password(),',
        '})',
      ].join('\n'),
    )

    assert.deepEqual(check(file, ['AuthenticationSignUpValidator']), [])
  })

  test('with phone accepted, whatsapp, ownerPhone and the document are still refused', ({
    assert,
  }) => {
    const file = validator(
      [
        '  email: vine.string().trim().email(),',
        '  phone: vine.string().trim(),',
        '  whatsapp: vine.string().trim(),',
        '  ownerPhone: vine.string().trim(),',
        '  cpf: vine.string().trim(),',
        '})',
      ].join('\n'),
    )

    assert.deepEqual(
      check(file, ['AuthenticationSignUpValidator']).map((f) => f.line),
      [6, 7, 8],
    )
  })

  test('the finding names the field, besides the line', ({ assert }) => {
    const file = validator(
      [
        '  name: vine.string().trim(),',
        '  taxId: vine.string().trim(),',
        '})',
      ].join('\n'),
    )

    const [finding] = check(file, ['AuthenticationSignUpValidator'])

    assert.equal(finding?.line, 5)
    assert.include(finding?.message ?? '', '`taxId`')
  })

  test('only the listed validators are read: a sign-in may ask for the phone', ({
    assert,
  }) => {
    const file = validator('  name: vine.string().trim(),\n})')

    assert.deepEqual(check(file, ['AuthenticationSignUpValidator']), [])
  })

  test('a field named in a comment is not a field', ({ assert }) => {
    const file = validator(
      [
        '  // cpf: the document is asked on the profile page, after the login',
        '  name: vine.string().trim(),',
        '})',
      ].join('\n'),
    )

    assert.deepEqual(check(file, ['AuthenticationSignUpValidator']), [])
  })

  test('a listed name that no validator declares fails instead of checking nothing', ({
    assert,
  }) => {
    const findings = check(validator('  name: vine.string().trim(),\n})'), [
      'AuthenticationSignUpMissingValidator',
    ])

    assert.deepEqual(
      findings.map((finding) => finding.rule),
      ['unknown-signup-validator'],
    )
  })

  test('without a list there is no rule, so a project that has none keeps passing', ({
    assert,
  }) => {
    const file = validator('  cpf: vine.string().trim(),\n})')

    assert.deepEqual(check(file, []), [])
  })

  test('the sensitive list covers the documented fields', ({ assert }) => {
    for (const word of [
      'cpf',
      'cnpj',
      'document',
      'phone',
      'whatsapp',
      'pix',
      'address',
      'birth',
      'bank',
    ])
      assert.isTrue(PatternRules.SENSITIVE_SIGNUP_WORDS.has(word), word)
  })

  test('the list of names from outside is narrowed', ({ assert }) => {
    assert.throws(() => PatternCheck.names({}))
    assert.throws(() => PatternCheck.names([1]))
    assert.deepEqual(PatternCheck.names(['AuthenticationSignUpValidator']), [
      'AuthenticationSignUpValidator',
    ])
  })
})

test.group('check-report', () => {
  test('groups by section and returns the exit code', ({ assert }) => {
    const lines: string[] = []
    const code = CheckReport.print(
      'x',
      [PatternCheck.meta('a.ts', 'r', 'm')],
      (line) => lines.push(line),
    )
    assert.equal(code, 1)
    assert.include(lines.join('\n'), 'backend.md §10')
    assert.equal(
      CheckReport.print('x', [], () => {}),
      0,
    )
  })
})

test.group(
  'pattern:check > shared sign-up validator (DECISIONS.md #809)',
  () => {
    const file = {
      path: 'shared/src/validators/authentication/sign-up.validator.ts',
      text: [
        "import { z } from '../../validator.js'",
        '',
        'export const AuthenticationSignUpValidator = z.object({',
        '  name: z.string().trim(),',
        '  document: z.string().trim(),',
        '  phone: z.string().trim(),',
        '})',
      ].join('\n'),
    }
    const check = (names: ReadonlyArray<string>) =>
      PatternCheck.run({
        files: [file],
        exceptions: [],
        baseline: [],
        signupValidators: names,
      })

    test('a sensitive field in a Zod sign-up of shared/ is refused, at its line', ({
      assert,
    }) => {
      assert.deepEqual(
        check(['AuthenticationSignUpValidator']).map((f) => [f.rule, f.line]),
        [['public-signup-minimum', 5]],
      )
    })

    test('a name declared nowhere still fails', ({ assert }) => {
      assert.deepEqual(
        check(['Missing']).map((f) => f.rule),
        ['unknown-signup-validator'],
      )
    })
  },
)

test.group(
  'pattern:check > git inherited from a hook (DECISIONS.md #809)',
  (group) => {
    const git = (cwd: string, ...args: string[]) =>
      execFileSync('git', args, {
        cwd,
        env: PatternCheck.gitEnv(),
        stdio: 'pipe',
      })
    let base = ''
    let project = ''
    let other = ''

    group.each.setup(() => {
      base = mkdtempSync(join(tmpdir(), 'pattern-check-git-'))
      project = join(base, 'project')
      other = join(base, 'other')
      for (const dir of [project, other]) {
        mkdirSync(dir)
        git(dir, 'init', '-q')
      }
      mkdirSync(join(project, 'backend/app'), { recursive: true })
      writeFileSync(join(project, 'backend/app/a.ts'), 'export const a = 1\n')
      git(project, 'add', '.')
    })
    group.each.teardown(() => rmSync(base, { recursive: true, force: true }))

    test('gitEnv drops what git exports to a hook', ({ assert }) => {
      const env = PatternCheck.gitEnv({
        PATH: '/bin',
        GIT_DIR: 'x',
        GIT_WORK_TREE: 'y',
        GIT_INDEX_FILE: 'z',
      })
      assert.deepEqual(env, { PATH: '/bin' })
    })

    test('with GIT_DIR of another repository it still reads the files of the root', ({
      assert,
    }) => {
      const files = PatternCheck.read(project, {
        ...process.env,
        GIT_DIR: join(other, '.git'),
        GIT_WORK_TREE: other,
        GIT_INDEX_FILE: join(other, '.git/index'),
      })
      assert.deepEqual(
        files.map((f) => f.path),
        ['backend/app/a.ts'],
      )
    })

    test('zero files in a project with backend/app fails instead of passing', ({
      assert,
    }) => {
      git(project, 'rm', '-rq', '--cached', '.')
      assert.throws(() => PatternCheck.read(project), /read 0 files/)
    })
  },
)
