// @vitest-environment jsdom

import type { MutationFunctionContext } from '@tanstack/react-query'
import { fromPartial } from '@total-typescript/shoehorn'
import type * as React from 'react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HTTPError } from '#/integrations/tanstack-query/http'
import { m } from '#/paraglide/messages'

import { writeFeedback } from './mutation-feedback'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const invalidateQueries = vi.fn()

const CONTEXT = fromPartial<MutationFunctionContext>({
  client: { invalidateQueries },
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('writeFeedback', () => {
  it('invalidates every family, then notifies, then calls onDone', async () => {
    const order: Array<string> = []
    invalidateQueries.mockImplementation(() => {
      order.push('invalidate')
      return Promise.resolve()
    })
    vi.mocked(toast.success).mockImplementation(() => {
      order.push('toast')
      return 1
    })

    const options = writeFeedback<{ done: number }, string>({
      invalidate: [['users'], ['stats']],
      success: (data) => `${data.done} arquivados`,
      description: 'Estão na lixeira.',
      errorId: 'archive-error',
      onDone: () => {
        order.push('done')
      },
    })

    await options.onSuccess?.({ done: 3 }, 'x', undefined, CONTEXT)

    expect(order).toEqual(['invalidate', 'invalidate', 'toast', 'done'])
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['stats'] })
    expect(toast.success).toHaveBeenCalledWith('3 arquivados', {
      description: 'Estão na lixeira.',
    })
  })

  it('words the API error in one place, with a fixed id', () => {
    const options = writeFeedback<void, string>({
      invalidate: [],
      success: 'Feito.',
      errorId: 'remove-error',
    })
    const error = new HTTPError({
      message: 'Já existe',
      status: 409,
      code: 'ALREADY_EXISTS',
    })

    options.onError?.(error, 'x', undefined, CONTEXT)

    expect(toast.error).toHaveBeenCalledWith('Já existe', {
      id: 'remove-error',
      action: undefined,
    })
  })

  it('offers "Tentar de novo" with the same payload, and only when the error is retry-safe', () => {
    const retry = vi.fn()
    const options = writeFeedback<void, string>({
      invalidate: [],
      success: 'Feito.',
      errorId: 'e',
      retry,
    })

    options.onError?.(
      new HTTPError({ message: 'Falhou', status: 500, code: 'INTERNAL_ERROR' }),
      'payload-1',
      undefined,
      CONTEXT,
    )

    const action = vi.mocked(toast.error).mock.calls[0]?.[1]?.action
    expect(action).toMatchObject({ label: m.kit_retry() })

    if (typeof action === 'object' && action !== null && 'onClick' in action)
      action.onClick(fromPartial<React.MouseEvent<HTMLButtonElement>>({}))
    expect(retry).toHaveBeenCalledWith('payload-1')

    vi.mocked(toast.error).mockClear()
    options.onError?.(
      new HTTPError({ message: 'Inválido', status: 422, code: 'VALIDATION' }),
      'payload-2',
      undefined,
      CONTEXT,
    )

    expect(vi.mocked(toast.error).mock.calls[0]?.[1]?.action).toBeUndefined()
  })
})
