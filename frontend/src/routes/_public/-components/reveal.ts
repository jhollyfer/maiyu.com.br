/**
 * The entrance of the blocks.
 *
 * A `tw-animate-css` class and not `motion/react`, as in academy: the old site
 * loaded the whole of framer-motion to do a `fade` with a
 * shift, which is two lines of CSS. On a phone on an unstable 4G, which is
 * that of a good share of those who visit from the Alto Solimões, the difference is the
 * time until the page responds to the finger.
 *
 * `[animation-fill-mode:both]` because the entrance is delayed: without it the block
 * would appear whole, vanish and come back at the end of the delay.
 *
 * `motion-reduce:animate-none` for whoever asked for less motion. The global rule
 * in `styles.css` already zeroes the duration, and this one keeps the initial state from leaving
 * the block invisible when the animation is cancelled.
 */
export const REVEAL =
  'animate-in fade-in-0 slide-in-from-bottom-4 duration-700 [animation-fill-mode:both] motion-reduce:animate-none'

/** The delay between one item and the next, in milliseconds. */
export const STAGGER = 80
