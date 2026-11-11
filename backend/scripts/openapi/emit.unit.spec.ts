import { test } from '@japa/runner'

import { requestShape } from './emit.ts'

import {
  IdentifierValidator,
  PaginationValidator,
  Rule,
  vine,
} from '#core/validator'

/**
 * What the generator publishes as the input of an operation (`DECISIONS.md` #375). The
 * archive and delete actions read only `IdentifierValidator`: the `:id` is the whole input,
 * and the document must not ask a client for a `params` query parameter nor for a body.
 */
test.group('openapi:generate > request shape (unit)', () => {
  const input = {
    operationId: 'test',
    pathParams: ['id'],
  }

  for (const method of ['delete', 'patch', 'post', 'get']) {
    test(`${method} with IdentifierValidator: only the path parameter, no body`, ({
      assert,
    }) => {
      const shape = requestShape(
        { body: IdentifierValidator },
        { ...input, method },
        [],
      )

      assert.deepEqual(
        shape.parameters.map(({ name, in: location, required }) => ({
          name,
          location,
          required,
        })),
        [{ name: 'id', location: 'path', required: true }],
      )
      assert.isUndefined(shape.body)
    })
  }

  test('IdentifierValidator read from the query string is still the route, not a query parameter', ({
    assert,
  }) => {
    const shape = requestShape(
      { query: IdentifierValidator },
      { ...input, method: 'delete' },
      [],
    )

    assert.deepEqual(
      shape.parameters.map(({ name, in: location }) => `${location}:${name}`),
      ['path:id'],
    )
    assert.isUndefined(shape.body)
  })

  test('the path parameter keeps the uuid format of the validator', ({
    assert,
  }) => {
    const [id] = requestShape(
      { body: IdentifierValidator },
      { ...input, method: 'delete' },
      [],
    ).parameters

    assert.equal(id?.schema.format, 'uuid')
  })

  test('params and body: the route goes to the path, the rest to the body', ({
    assert,
  }) => {
    const shape = requestShape(
      {
        body: vine.create({
          ...Rule.identifierParams(),
          title: vine.string().maxLength(10),
        }),
      },
      { ...input, method: 'patch' },
      [],
    )

    assert.deepEqual(
      shape.parameters.map(({ name, in: location }) => `${location}:${name}`),
      ['path:id'],
    )
    assert.deepEqual(Object.keys(shape.body?.properties ?? {}), ['title'])
    assert.notInclude(shape.body?.required ?? [], 'params')
  })

  test('a GET listing: the query fields stay optional', ({ assert }) => {
    const shape = requestShape(
      { body: PaginationValidator },
      { operationId: 'test', pathParams: [], method: 'get' },
      [],
    )

    assert.isUndefined(shape.body)
    assert.isTrue(shape.parameters.every((each) => each.in === 'query'))
    assert.isTrue(shape.parameters.every((each) => !each.required))
  })
})
