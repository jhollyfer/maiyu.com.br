import { describe, expect, it, vi } from 'vitest'

import { failOnUndefinedImport } from './build-log'

describe('failOnUndefinedImport', () => {
  it('when an import is undefined, it throws with the code and the message', () => {
    const handler = vi.fn()
    const log = { code: 'IMPORT_IS_UNDEFINED', message: '"x" is not exported' }

    expect(() => failOnUndefinedImport('warn', log, handler)).toThrow(
      'IMPORT_IS_UNDEFINED: "x" is not exported',
    )
    expect(handler).not.toHaveBeenCalled()
  })

  it('when the log is any other warning, it keeps the level', () => {
    const handler = vi.fn()
    const log = { code: 'CIRCULAR_DEPENDENCY', message: 'cycle' }

    failOnUndefinedImport('warn', log, handler)

    expect(handler).toHaveBeenCalledExactlyOnceWith('warn', log)
  })

  it('when the log has no code, it keeps the level', () => {
    const handler = vi.fn()
    const log = { message: 'something' }

    failOnUndefinedImport('info', log, handler)

    expect(handler).toHaveBeenCalledExactlyOnceWith('info', log)
  })
})
