import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  LocalStore,
  isFilledString,
  listStoreOptions,
  localKeys,
  readLocalItem,
  removeLocalItem,
  writeLocalItem,
} from './local-store'

/** An in-memory `localStorage`, the shape the guarded calls use. */
function withStorage(): Map<string, string> {
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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('guarded localStorage calls', () => {
  it('read, write, remove and list keys by prefix', () => {
    const data = withStorage()

    writeLocalItem('upload:a', '1')
    writeLocalItem('upload:b', '2')
    writeLocalItem('cart', '3')

    expect(readLocalItem('upload:a')).toBe('1')
    expect(localKeys('upload:')).toEqual(['upload:a', 'upload:b'])

    removeLocalItem('upload:a')

    expect(data.has('upload:a')).toBe(false)
    expect(readLocalItem('upload:a')).toBeNull()
  })

  it('fail quietly when there is no storage (SSR, privacy mode)', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(readLocalItem('x')).toBeNull()
    expect(localKeys('x')).toEqual([])
    expect(() => {
      writeLocalItem('x', '1')
    }).not.toThrow()
    expect(() => {
      removeLocalItem('x')
    }).not.toThrow()
  })
})

/**
 * In a `node` environment there is no `window`: writing fails and is swallowed, which is the
 * private mode path. What is tested is the in-memory value.
 */
describe('LocalStore', () => {
  it('is born on the fallback and keeps what it receives', () => {
    const store = new LocalStore({
      key: 'teste',
      fallback: 0,
      parse: Number,
      serialize: String,
    })

    expect(store.get()).toBe(0)
    expect(store.getServerSnapshot()).toBe(0)

    store.set(3)

    expect(store.get()).toBe(3)
    expect(store.getSnapshot()).toBe(3)
    expect(store.getServerSnapshot()).toBe(0)
  })
})

describe('listas gravadas', () => {
  const options = listStoreOptions('teste', isFilledString)

  it('discards the item that does not pass the guard and keeps the rest', () => {
    expect(options.parse('["a", 1, "", "b"]')).toEqual(['a', 'b'])
  })

  it('returns the empty reference for an empty list or wrong format', () => {
    expect(options.parse('[]')).toBe(options.fallback)
    expect(options.parse('[1, 2]')).toBe(options.fallback)
    expect(options.parse('{"a": 1}')).toBe(options.fallback)
  })

  it('goes back to the empty reference when it empties', () => {
    const store = new LocalStore(options)

    store.set(['a'])
    store.set([])

    expect(store.get()).toBe(options.fallback)
  })

  it('deletes the key when the list becomes empty', () => {
    expect(options.serialize([])).toBeNull()
    expect(options.serialize(['a'])).toBe('["a"]')
  })
})
