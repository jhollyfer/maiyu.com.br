import type { Either } from '@maiyu/shared'

/**
 * The right side of the result; a `left` in the arrangement or the assertion fails the test.
 *
 * It lives apart from the storage fixtures because every use case returns an `Either`: a spec
 * that only reads the result does not have to load the bucket and repository doubles to do it.
 */
export function rightOf<L, R>(result: Either<L, R>): R {
  if (result.isLeft())
    throw new Error(
      `esperava right, veio left: ${JSON.stringify(result.value)}`,
    )

  return result.value
}
