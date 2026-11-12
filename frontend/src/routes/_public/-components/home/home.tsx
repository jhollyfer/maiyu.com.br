import type * as React from 'react'

import { Audience } from './audience'
import { Capabilities } from './capabilities'
import { ClosingCta } from './closing-cta'
import { Hero } from './hero'
import { NavyBand } from './navy-band'
import { Process } from './process'
import { Roots } from './roots'
import { Vision } from './vision'
import { Work } from './work'

/**
 * The home, assembled.
 *
 * Composition only, as in academy: the order here is the order on screen. First
 * what Maiyu is (hero) and the proof that it delivers (live projects); right after,
 * where it comes from (Indigenous, from the triple border), which is the differentiator; then
 * the thesis (the vision), the method (how we work), what it does (services) and
 * for whom (the audiences); finally who does it (the team and the journal, in the navy band)
 * and the invitation.
 *
 * No section reads an API: the content lives in `lib/`, and so there is no
 * `useQuery` or missing-data guard here.
 */
export function Home(): React.JSX.Element {
  return (
    <>
      <Hero />
      <Work />
      <Roots />
      <Vision />
      <Process />
      <Capabilities />
      <Audience />
      <NavyBand />
      <ClosingCta />
    </>
  )
}
