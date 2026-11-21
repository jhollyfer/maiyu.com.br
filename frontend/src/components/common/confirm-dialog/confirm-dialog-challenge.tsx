import { ArrowsClockwiseIcon, WarningIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Field, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/cn'
import { ConfirmChallenge } from '#/lib/confirm-challenge'
import type { ChallengeRandom } from '#/lib/confirm-challenge'
import { m } from '#/paraglide/messages'
import type { Merge } from '@maiyu/shared'

import { useConfirmDialogContext } from './confirm-dialog-context'

type ConfirmDialogWarningProps = Merge<
  React.ComponentProps<typeof Alert>,
  {
    /** How many items go away. Absent (or zero) hides the count. */
    readonly count?: number
  }
>

/**
 * The red warning of an irreversible action, with the count of what goes away.
 *
 * Part of the strong confirmation: put it inside `ConfirmDialog`, between the header and the
 * footer, next to `ConfirmDialogChallenge`.
 */
export function ConfirmDialogWarning({
  count = 0,
  className,
  ...rest
}: ConfirmDialogWarningProps): React.JSX.Element {
  return (
    <Alert
      variant="destructive"
      data-slot="confirm-dialog-warning"
      className={cn('border-destructive/30 bg-destructive/10', className)}
      {...rest}
    >
      <WarningIcon />
      <AlertTitle>{m.kit_confirm_warning_title()}</AlertTitle>
      {count > 0 && (
        <AlertDescription>
          {m.kit_confirm_warning_items({ count })}
        </AlertDescription>
      )}
    </Alert>
  )
}

type ConfirmDialogChallengeProps = Merge<
  React.ComponentProps<typeof Field>,
  {
    /**
     * The source of randomness; `Math.random` by default. A test injects a fixed sequence and
     * gets the same question every time.
     */
    readonly random?: ChallengeRandom
  }
>

/**
 * The sum to answer before the confirm button releases.
 *
 * **Its presence is what turns the challenge on**: the part reports itself to the dialog on
 * mount (`reportChallenge('pending')`) and the confirm button waits. The alert content only
 * mounts when it opens, so the question renews itself on every opening without an effect keyed
 * on `open`; and on closing the part unmounts and reports `absent`, which clears the wait.
 */
export function ConfirmDialogChallenge({
  random = Math.random,
  className,
  ...rest
}: ConfirmDialogChallengeProps): React.JSX.Element {
  const { isPending, reportChallenge } = useConfirmDialogContext(
    'ConfirmDialogChallenge',
  )
  const inputId = React.useId()
  const [question, setQuestion] = React.useState(() =>
    ConfirmChallenge.create(random),
  )
  const [answer, setAnswer] = React.useState('')

  const isSolved = ConfirmChallenge.isSolved(answer, question.expected)

  // Layout effect: the confirm button must already be held on the first paint, never one frame
  // enabled. `reportChallenge` is a state setter, stable.
  React.useLayoutEffect(() => {
    if (isSolved) reportChallenge('solved')
    else reportChallenge('pending')
  }, [isSolved, reportChallenge])

  React.useLayoutEffect(() => {
    return () => reportChallenge('absent')
  }, [reportChallenge])

  function regenerate(): void {
    setQuestion(ConfirmChallenge.create(random))
    setAnswer('')
  }

  return (
    <Field
      data-slot="confirm-dialog-challenge"
      className={cn('gap-2', className)}
      {...rest}
    >
      <FieldLabel htmlFor={inputId}>
        {m.kit_confirm_challenge_label({ question: question.question })}
      </FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          disabled={isPending}
          placeholder={m.kit_confirm_challenge_placeholder()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={regenerate}
          disabled={isPending}
          aria-label={m.kit_confirm_challenge_regenerate()}
        >
          <ArrowsClockwiseIcon />
        </Button>
      </div>
    </Field>
  )
}
