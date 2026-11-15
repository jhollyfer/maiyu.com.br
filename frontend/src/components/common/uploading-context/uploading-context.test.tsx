// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'

import {
  UploadingProvider,
  useIsUploading,
  useRegisterUpload,
} from '#/components/common/uploading-context/uploading-context'

type FieldProps = { readonly active: boolean }

function Field({ active }: FieldProps): React.JSX.Element {
  useRegisterUpload(active)
  return <span>field</span>
}

function Status(): React.JSX.Element {
  const uploading = useIsUploading()
  if (uploading) return <output>busy</output>
  return <output>idle</output>
}

describe('UploadingContext', () => {
  it('when no field is uploading, the status is idle', () => {
    render(
      <UploadingProvider>
        <Field active={false} />
        <Status />
      </UploadingProvider>,
    )

    expect(screen.getByRole('status').textContent).toBe('idle')
  })

  it('when a field is active, the status is busy', () => {
    render(
      <UploadingProvider>
        <Field active />
        <Status />
      </UploadingProvider>,
    )

    expect(screen.getByRole('status').textContent).toBe('busy')
  })

  it('when one of two fields finishes, the status stays busy until the other does', () => {
    const { rerender } = render(
      <UploadingProvider>
        <Field active />
        <Field active />
        <Status />
      </UploadingProvider>,
    )

    rerender(
      <UploadingProvider>
        <Field active={false} />
        <Field active />
        <Status />
      </UploadingProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('busy')

    rerender(
      <UploadingProvider>
        <Field active={false} />
        <Field active={false} />
        <Status />
      </UploadingProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('idle')
  })

  it('when an uploading field unmounts, the lock is released', () => {
    const { rerender } = render(
      <UploadingProvider>
        <Field active />
        <Status />
      </UploadingProvider>,
    )

    rerender(
      <UploadingProvider>
        <Status />
      </UploadingProvider>,
    )

    expect(screen.getByRole('status').textContent).toBe('idle')
  })

  it('when there is no provider, the field renders and nothing is uploading', () => {
    render(
      <>
        <Field active />
        <Status />
      </>,
    )

    expect(screen.getByRole('status').textContent).toBe('idle')
  })
})
