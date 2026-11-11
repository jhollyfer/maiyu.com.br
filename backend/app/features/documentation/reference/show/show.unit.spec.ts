import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import DocumentationReferenceShowUseCase from './show.use-case.ts'

import openapi from '#config/openapi'
import { rightOf } from '#tests/either-fixtures'

test.group('documentation/reference > show (unit)', () => {
  test('the page points at /openapi.json and carries the API title', async ({
    assert,
  }) => {
    const useCase = await app.container.make(DocumentationReferenceShowUseCase)
    const page = rightOf(useCase.execute())

    assert.include(page, '/openapi.json')
    assert.include(page, openapi.info.title)
  })
})
