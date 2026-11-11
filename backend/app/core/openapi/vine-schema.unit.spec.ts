import { test } from '@japa/runner'

import { VineSchema } from '#core/openapi/vine-schema'
import { IdentifierValidator, Rule, vine } from '#core/validator'

/**
 * The `params` block of a validator (`DECISIONS.md` #375) is the route, not the body.
 * Without the split, every action with `:id` would publish a body field `params` that no
 * client sends, and an action whose only input is the `:id` would gain a request body.
 */
test.group('VineSchema > splitParams', () => {
  test('when the validator has only params, nothing is left for the body', ({
    assert,
  }) => {
    const { params, rest } = VineSchema.splitParams(
      VineSchema.toSchema(IdentifierValidator, 'test', []),
    )

    assert.isUndefined(rest)
    assert.deepEqual(
      VineSchema.toParameters(params ?? {}, 'path').map((each) => each.name),
      ['id'],
    )
  })

  test('when the validator has params and body, each goes to its place', ({
    assert,
  }) => {
    const validator = vine.create({
      ...Rule.identifierParams(),
      title: vine.string().maxLength(10),
    })

    const { params, rest } = VineSchema.splitParams(
      VineSchema.toSchema(validator, 'test', []),
    )

    assert.properties(params?.properties ?? {}, ['id'])
    assert.deepEqual(Object.keys(rest?.properties ?? {}), ['title'])
    assert.notInclude(rest?.required ?? [], 'params')
  })

  test('when the validator has no params, the schema passes untouched', ({
    assert,
  }) => {
    const schema = VineSchema.toSchema(
      vine.create({ title: vine.string().maxLength(10) }),
      'test',
      [],
    )

    assert.deepEqual(VineSchema.splitParams(schema), { rest: schema })
  })
})
