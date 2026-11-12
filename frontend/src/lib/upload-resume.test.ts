import { fromPartial } from '@total-typescript/shoehorn'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearResume,
  readResume,
  resumeKey,
  writeResume,
} from './upload-resume'

/**
 * `localStorage` does not exist in the test environment (it runs in node), which is the
 * same case as SSR: and it is precisely the case the module must survive.
 * Each test builds its own.
 */
function withStorage() {
  const data = new Map<string, string>()

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    get length() {
      return data.size
    },
    key: (index: number) => [...data.keys()][index] ?? null,
  })

  return data
}

function fileOf(name: string, size: number, lastModified: number): File {
  return fromPartial<File>({ name, size, lastModified })
}

const FILE = fileOf('catalogo.pdf', 5_000, 1_700_000_000_000)

const ENTRY = { storageId: 'abc', uploadId: 'upload-1', partSize: 1024 }

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('resumeKey', () => {
  it('is stable for the same file', () => {
    expect(resumeKey(FILE)).toBe(
      resumeKey(fileOf('catalogo.pdf', 5_000, 1_700_000_000_000)),
    )
  })

  it('changes when any of the three fields changes', () => {
    const base = resumeKey(FILE)

    expect(resumeKey(fileOf('outro.pdf', 5_000, 1_700_000_000_000))).not.toBe(
      base,
    )
    expect(
      resumeKey(fileOf('catalogo.pdf', 5_001, 1_700_000_000_000)),
    ).not.toBe(base)
    expect(
      resumeKey(fileOf('catalogo.pdf', 5_000, 1_700_000_000_001)),
    ).not.toBe(base)
  })
})

describe('readResume', () => {
  it('returns what was stored', () => {
    withStorage()
    writeResume(FILE, ENTRY)

    expect(readResume(FILE)).toEqual(ENTRY)
  })

  it('is null when nothing is stored', () => {
    withStorage()

    expect(readResume(FILE)).toBeNull()
  })

  it('is null after clearing', () => {
    withStorage()
    writeResume(FILE, ENTRY)
    clearResume(FILE)

    expect(readResume(FILE)).toBeNull()
  })

  it('is null for garbage, and does not blow up', () => {
    const data = withStorage()
    data.set(resumeKey(FILE), 'isto não é json')

    expect(readResume(FILE)).toBeNull()
  })

  it('is null for json with the wrong shape', () => {
    const data = withStorage()
    data.set(resumeKey(FILE), JSON.stringify({ storageId: 42 }))

    expect(readResume(FILE)).toBeNull()
  })

  it('accepts a null uploadId, which is the single-part upload', () => {
    withStorage()
    writeResume(FILE, { ...ENTRY, uploadId: null })

    expect(readResume(FILE)?.uploadId).toBeNull()
  })
})

/**
 * The entry has a deadline because the server has one too: after 24h
 * `storages:prune` already deleted the abandoned upload, and the resume points to a
 * `storageId` that no longer exists.
 */
describe('validade', () => {
  it('is null after expiring', () => {
    withStorage()
    writeResume(FILE, ENTRY)

    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000)

    expect(readResume(FILE)).toBeNull()

    vi.useRealTimers()
  })

  it('still holds before expiring', () => {
    withStorage()
    writeResume(FILE, ENTRY)

    vi.setSystemTime(Date.now() + 23 * 60 * 60 * 1000)

    expect(readResume(FILE)).toEqual(ENTRY)

    vi.useRealTimers()
  })

  it('storing sweeps the expired entries of the other files', () => {
    const data = withStorage()
    const velho = fileOf('velho.pdf', 1, 1)

    writeResume(velho, ENTRY)

    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000)

    // Nobody will try `velho.pdf` again: if the sweep does not reach it on
    // another file's write, it stays on disk forever.
    writeResume(FILE, ENTRY)

    expect(data.has(resumeKey(velho))).toBe(false)
    expect(data.has(resumeKey(FILE))).toBe(true)

    vi.useRealTimers()
  })

  it('the sweep takes along what cannot be read', () => {
    const data = withStorage()
    data.set('upload:lixo.pdf:1:1', 'isto não é json')

    writeResume(FILE, ENTRY)

    expect(data.has('upload:lixo.pdf:1:1')).toBe(false)
  })

  it('the sweep does not touch what is not a resume', () => {
    const data = withStorage()
    data.set('tema', 'escuro')

    writeResume(FILE, ENTRY)

    expect(data.get('tema')).toBe('escuro')
  })
})

describe('without localStorage', () => {
  it('reads null and stores without blowing up - it is the SSR case', () => {
    expect(() => writeResume(FILE, ENTRY)).not.toThrow()
    expect(readResume(FILE)).toBeNull()
    expect(() => clearResume(FILE)).not.toThrow()
  })
})
