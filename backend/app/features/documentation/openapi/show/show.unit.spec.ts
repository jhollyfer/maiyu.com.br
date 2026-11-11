import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import DocumentationOpenapiShowUseCase from './show.use-case.ts'

import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

test.group('documentation/openapi > show (unit)', (group) => {
  insideHttpContext(group)

  test('returns the committed document, as OpenAPI 3 JSON', async ({
    assert,
  }) => {
    const useCase = await app.container.make(DocumentationOpenapiShowUseCase)
    const specification = rightOf(await useCase.execute())

    assert.match(specification, /"openapi":\s*"3\./)
    assert.isObject(JSON.parse(specification))
  })

  test('the second read returns the same text, without rereading the disk', async ({
    assert,
  }) => {
    const useCase = await app.container.make(DocumentationOpenapiShowUseCase)

    const first = rightOf(await useCase.execute())
    const second = rightOf(await useCase.execute())

    assert.strictEqual(second, first)
  })
})
