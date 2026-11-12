// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { VisionScene } from './vision-scenes'
import type { VisionStep } from './vision-scenes'

afterEach(cleanup)

const STEPS: ReadonlyArray<VisionStep> = [0, 1, 2]

describe('VisionScene', () => {
  it.each(STEPS)(
    'when step %s is shown, its entrance switches itself off for reduced motion',
    (step) => {
      const { container } = render(<VisionScene step={step} />)

      const scene = container.querySelector('[data-slot="vision-scene"]')
      if (!scene) throw new Error('the vision scene was not rendered')

      expect(scene.classList.contains('motion-reduce:animate-none')).toBe(true)
    },
  )

  it('when the rings scene is shown, every stroke comes back without animation', () => {
    // Without this the samauma ring is invisible to whoever turned off
    // motion: the stroke offset is the very initial state.
    const { container } = render(<VisionScene step={2} />)
    const strokes = Array.from(container.querySelectorAll('path.vision-draw'))

    expect(strokes.length).toBeGreaterThan(0)
    for (const stroke of strokes)
      expect(
        stroke.classList.contains('motion-reduce:[stroke-dashoffset:0]'),
      ).toBe(true)
  })
})
