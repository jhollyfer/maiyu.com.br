import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import {
  AuthShellContent,
  AuthShellDescription,
  AuthShellHeader,
  AuthShellTitle,
} from '#/components/common/auth-shell/auth-shell'
import { SignInForm } from '#/components/common/sign-in-form/sign-in-form'
import { m } from '#/paraglide/messages'

import { SignInFooter } from './-sign-in-footer'

export const Route = createLazyFileRoute('/_authentication/sign-in/')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return (
    <>
      <AuthShellHeader>
        <AuthShellTitle>{m.kit_sign_in_title()}</AuthShellTitle>
        <AuthShellDescription>
          {m.kit_sign_in_description()}
        </AuthShellDescription>
      </AuthShellHeader>
      <AuthShellContent>
        <SignInForm />
        <SignInFooter />
      </AuthShellContent>
    </>
  )
}
