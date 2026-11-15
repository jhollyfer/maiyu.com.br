import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Without `globals`, Testing Library does not clean the DOM between tests by itself: a render
// would leak into the next test. Here once for every file, instead of an `afterEach` each file
// can forget (_doc-lib/testing-library-react.md, setup; DECISIONS.md #350).
afterEach(cleanup)
