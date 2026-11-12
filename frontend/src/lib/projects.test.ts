import { describe, expect, it } from 'vitest'

import { projects } from './projects'

describe('projects', () => {
  it('says which projects are still in validation, and does not sell them as finished', () => {
    const status = Object.fromEntries(
      projects.map((project) => [project.slug, project.status]),
    )

    expect(status).toEqual({
      adacaibs: 'production',
      academy: 'production',
      aporta: 'validation',
      curupira: 'validation',
      interclasse: 'validation',
    })
  })
})
