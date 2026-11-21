// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageShell, PageShellContent } from './page-shell'

describe('PageShellContent', () => {
  it('filhos não encolhem: o Card não é cortado, a área é que rola', () => {
    const { container } = render(
      <PageShell>
        <PageShellContent>
          <div data-testid="card">conteúdo</div>
        </PageShellContent>
      </PageShell>,
    )
    const content = container.querySelector('[data-slot="page-shell-content"]')

    expect(content?.className).toContain('*:shrink-0')
    expect(content?.className).toContain('overflow-auto')
  })
})
