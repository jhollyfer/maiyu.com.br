/**
 * The names of the domain accounts the project's `e2e:accounts` creates beyond the skeleton's roles
 * (`backend/tests/e2e-project-accounts.ts`, DECISIONS.md #611), for `E2eAccountsStore.stateOf('<name>')`
 * to type them. It is the project's file (KIT.md §3.4): the sync creates this empty model when it
 * is missing and never overwrites it. The list must have the same names as `ProjectE2eAccounts.accounts`;
 * `E2eAccountsStore.create` fails when it does not, and also when a name repeats a role of the kit
 * (`platformOwner`, `staff`...), `project`, `accounts` or another name: each name is a file in
 * `playwright/.auth/`, and the type refuses it too.
 */
export const PROJECT_E2E_ACCOUNT_NAMES =
  [] as const satisfies ReadonlyArray<string>
