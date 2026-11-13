import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { test } from '@japa/runner'

import { AdonisjsCheck } from './adonisjs-check.ts'

const REGISTRY = '.adonisjs/client/registry/index.ts'

/** A backend whose registry holds `registry`; the caller removes the dir. */
function backend(registry: string, dirs: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'adonisjs-check-'))
  dirs.push(root)
  mkdirSync(join(root, '.adonisjs/client/registry'), { recursive: true })
  writeFileSync(join(root, REGISTRY), registry)
  return root
}

/** A fake generator: what `node ace codegen` does, writing the registry for the current routes. */
function generator(root: string, registry: string): () => void {
  return () => {
    writeFileSync(join(root, REGISTRY), registry)
  }
}

test.group('adonisjs:check > registry in sync with the routes', (group) => {
  const dirs: string[] = []
  group.each.teardown(() => {
    for (const dir of dirs.splice(0))
      rmSync(dir, { recursive: true, force: true })
  })

  test('when the generator changes nothing, is not a finding', ({ assert }) => {
    const root = backend('a', dirs)
    assert.deepEqual(new AdonisjsCheck(root).run(generator(root, 'a')), [])
  })

  test('when a route is new, is a finding naming the stale file', ({
    assert,
  }) => {
    const root = backend('old', dirs)
    const [finding] = new AdonisjsCheck(root).run(generator(root, 'new'))

    assert.equal(finding?.file, REGISTRY)
    assert.equal(finding?.rule, 'adonisjs-stale')
  })

  test('the generator leaves the fresh file on disk, for the commit', ({
    assert,
  }) => {
    const root = backend('old', dirs)
    new AdonisjsCheck(root).run(generator(root, 'new'))

    assert.equal(readFileSync(join(root, REGISTRY), 'utf8'), 'new')
  })

  test('a file the generator creates or removes is a finding too', ({
    assert,
  }) => {
    const root = backend('a', dirs)
    const findings = new AdonisjsCheck(root).run(() => {
      rmSync(join(root, REGISTRY))
      writeFileSync(join(root, '.adonisjs/client/registry/extra.ts'), 'x')
    })

    assert.deepEqual(
      findings.map((finding) => finding.file),
      ['.adonisjs/client/registry/extra.ts', REGISTRY],
    )
  })
})
