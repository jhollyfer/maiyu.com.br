import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn with the project scale', () => {
  it('keeps the color when it comes with a size from the site scale', () => {
    // It was the primary button's defect: `text-small` was read as a color and
    // erased `text-primary-foreground`, and the text vanished into the background.
    expect(cn('text-primary-foreground', 'text-small')).toBe(
      'text-primary-foreground text-small',
    )
    expect(cn('text-navy', 'text-h2')).toBe('text-navy text-h2')
  })

  it('still swaps one size for the other', () => {
    expect(cn('text-small', 'text-body')).toBe('text-body')
  })
})
