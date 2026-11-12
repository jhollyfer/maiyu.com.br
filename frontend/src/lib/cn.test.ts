import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('knows the sizes of the theme: a color next to them stays, another size replaces them', () => {
    expect(cn('text-supporting', 'text-muted-foreground')).toBe(
      'text-supporting text-muted-foreground',
    )
    expect(cn('text-body', 'text-lead')).toBe('text-lead')
    expect(cn('text-caption', 'text-title')).toBe('text-title')
  })
})
