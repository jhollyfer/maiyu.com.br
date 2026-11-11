import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { configProvider } from '@adonisjs/core'
import { Emitter } from '@adonisjs/core/events'
import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, I18nManager } from '@adonisjs/i18n'
import type { I18nManagerConfig } from '@adonisjs/i18n/types'
import { test } from '@japa/runner'

import ProjectLabelsLoader from '#core/project-labels-loader'

/**
 * The kit and the project declare the same label (`slug`) and the project's has to win on every
 * boot. With the FS loader alone the winner changed with the order the reads finished, so one
 * load proves nothing: the spec loads many times, each with a new manager.
 */

const LOADS = 100

async function languageFiles(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'project-labels-'))
  const language = join(root, 'pt-BR')

  await mkdir(join(language, 'validator', 'shared'), { recursive: true })
  await writeFile(
    join(language, 'validator.json'),
    JSON.stringify({
      shared: {
        fields: { slug: 'o slug do kit', email: 'o e-mail' },
        messages: { required: 'Informe { field }' },
      },
    }),
  )
  await writeFile(
    join(language, 'validator', 'shared', 'fields.json'),
    JSON.stringify({ slug: 'o endereço', title: 'o título' }),
  )
  await writeFile(
    join(language, 'validator', 'shared', 'messages.json'),
    JSON.stringify({ required: 'Preencha { field }' }),
  )

  return root
}

async function load(location: string): Promise<Record<string, string>> {
  const config = await configProvider.resolve<I18nManagerConfig>(
    app,
    defineConfig({
      defaultLocale: 'pt-BR',
      formatter: formatters.icu(),
      loaders: ProjectLabelsLoader.layered(location),
    }),
  )
  if (!config) throw new Error('i18n config did not resolve')

  const manager = new I18nManager(new Emitter(app), config)
  await manager.reloadTranslations()

  return manager.getTranslationsFor('pt-BR')
}

test.group('ProjectLabelsLoader', (group) => {
  let location = ''

  group.setup(async () => {
    location = await languageFiles()
    return () => rm(location, { recursive: true, force: true })
  })

  test('when kit and project declare the same label, the project wins on every load', async ({
    assert,
  }) => {
    const labels = new Set<string | undefined>()
    const rules = new Set<string | undefined>()

    for (let index = 0; index < LOADS; index++) {
      const translations = await load(location)
      labels.add(translations['validator.shared.fields.slug'])
      rules.add(translations['validator.shared.messages.required'])
    }

    assert.deepEqual([...labels], ['o endereço'])
    assert.deepEqual([...rules], ['Preencha { field }'])
  })

  test('when only one side declares a key, it stays', async ({ assert }) => {
    const translations = await load(location)

    assert.equal(translations['validator.shared.fields.email'], 'o e-mail')
    assert.equal(translations['validator.shared.fields.title'], 'o título')
  })

  test('when a project file is not flat, the load fails with the path', async ({
    assert,
  }) => {
    const root = await mkdtemp(join(tmpdir(), 'project-labels-'))
    await mkdir(join(root, 'pt-BR', 'validator', 'shared'), { recursive: true })
    await writeFile(
      join(root, 'pt-BR', 'validator', 'shared', 'fields.json'),
      JSON.stringify({ slug: { nested: 'x' } }),
    )

    await assert.rejects(
      () => new ProjectLabelsLoader(root).load(),
      /fields\.json: "slug" is not a text/,
    )
    await rm(root, { recursive: true, force: true })
  })
})
