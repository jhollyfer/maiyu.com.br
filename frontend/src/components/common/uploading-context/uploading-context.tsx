import * as React from 'react'

type UploadingContextValue = {
  register: (key: string) => void
  unregister: (key: string) => void
  isUploading: boolean
}

const UploadingContext = React.createContext<UploadingContextValue | null>(null)

type UploadingProviderProps = {
  readonly children: React.ReactNode
}

/**
 * Who is uploading a file, right now, anywhere in the tree.
 *
 * It exists because of the submit: the upload happens at the moment of choice and the
 * form only learns the `id` after the file exists. Without this, saving
 * while the bar is still running sends a payload without the attachment - and the record is born
 * without an image, with no error to give it away.
 *
 * A `Set` of keys and not a counter: two upload fields on the same screen
 * register and cancel in unpredictable orders, and a counter that goes down twice
 * for the same field reaches zero with the other one still in flight.
 */
export function UploadingProvider({
  children,
}: UploadingProviderProps): React.JSX.Element {
  const [uploads, setUploads] = React.useState<Set<string>>(new Set())

  const register = React.useCallback((key: string) => {
    setUploads((previous) => {
      if (previous.has(key)) return previous

      const next = new Set(previous)
      next.add(key)
      return next
    })
  }, [])

  const unregister = React.useCallback((key: string) => {
    setUploads((previous) => {
      if (!previous.has(key)) return previous

      const next = new Set(previous)
      next.delete(key)
      return next
    })
  }, [])

  const value = React.useMemo(
    () => ({ register, unregister, isUploading: uploads.size > 0 }),
    [register, unregister, uploads.size],
  )

  return <UploadingContext value={value}>{children}</UploadingContext>
}

/**
 * Registers this field as busy while `active` is true.
 *
 * Outside an `UploadingProvider` it does nothing - the upload field keeps
 * working, just nobody is asking whether it finished.
 */
export function useRegisterUpload(active: boolean): void {
  const context = React.use(UploadingContext)
  const key = React.useId()

  React.useEffect(() => {
    if (!context) return

    if (active) context.register(key)
    if (!active) context.unregister(key)

    // Unmounting with an upload in flight must release the lock, otherwise the save
    // button stays locked forever.
    return () => context.unregister(key)
  }, [active, context, key])
}

/** Is there an upload in progress? Use it to disable the save button. */
export function useIsUploading(): boolean {
  const context = React.use(UploadingContext)

  return context?.isUploading ?? false
}
