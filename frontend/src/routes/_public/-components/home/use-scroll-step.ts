import * as React from 'react'

/**
 * Which of `steps` stretches of scrolling inside `ref` the reading is in.
 *
 * It is what motion's `useScroll({ target, offset: ['start start', 'end end'] })` did in the
 * vision section: progress goes from 0, when the top of the section touches the top of the
 * window, to 1, when its end touches the end. Here it is the same calculation with a scroll
 * listener, without loading the library for it.
 *
 * The state only changes when the stretch changes, and not on every pixel: `setState` with the
 * same step does not render again.
 *
 * It receives the steps, and not the count, and returns the step, and not the index: with
 * `noUncheckedIndexedAccess`, whoever indexed the list by number would receive
 * `T | undefined`. The non-empty tuple gives the initial step already typed.
 */
export function useScrollStep<T>(
  ref: React.RefObject<HTMLElement | null>,
  steps: readonly [T, ...T[]],
): T {
  const [step, setStep] = React.useState(steps[0])

  React.useEffect(() => {
    function update(): void {
      const element = ref.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      if (travel <= 0) return

      const progress = Math.min(1, Math.max(0, -rect.top / travel))

      const next =
        steps[Math.min(steps.length - 1, Math.floor(progress * steps.length))]
      if (next === undefined) return

      setStep(next)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref, steps])

  return step
}
