import { describe, expect, it } from 'vitest'

import { projects } from './projects'

describe('projects', () => {
  it('diz quais projetos ainda estão em validação, e não os vende como prontos', () => {
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
