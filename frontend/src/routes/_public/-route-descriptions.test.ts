import { describe, expect, it } from 'vitest'

import { m } from '#/paraglide/messages'

/**
 * The descriptions the `blog` index and the 404 route bring to `pageHead`: a summary too short gets
 * rewritten by the search engine, and the 404 without its own would inherit the home's.
 */
describe('public route descriptions', () => {
  it('the blog description is a full summary, not the hero lead', () => {
    const description = m.blog_meta_description()

    expect(description.length).toBeGreaterThanOrEqual(120)
    expect(description.length).toBeLessThanOrEqual(170)
    expect(description).not.toBe(m.blog_description())
  })

  it('the 404 description is its own, not the home one', () => {
    expect(m.kit_not_found_description()).not.toBe(m.site_description())
  })
})
