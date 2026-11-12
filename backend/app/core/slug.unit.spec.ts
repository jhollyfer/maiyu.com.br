import { test } from '@japa/runner'
import vine from '@vinejs/vine'

import { Rule as SharedRule } from '@maiyu/shared'

import { Rule } from '#core/validator'

const validate = vine.compile(vine.object({ slug: Rule.slug() }))

test.group('core > validator > slug (unit)', () => {
  test('refuses every reserved slug of the shared list', async ({ assert }) => {
    for (const slug of SharedRule.RESERVED_SLUGS) {
      const [error] = await validate.tryValidate({ slug })

      assert.isNotNull(error, slug)
    }
  })

  test('accepts a city or tenant slug that owns no fixed route', async ({
    assert,
  }) => {
    const result = await validate.validate({ slug: 'tabatinga' })

    assert.equal(result.slug, 'tabatinga')
  })
})
