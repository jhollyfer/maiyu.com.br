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

/**
 * The role map of the project (DECISIONS.md #778): the names under which `e2e:accounts` prints the
 * roles of the skeleton, the same list as `E2eSkeletonAccounts.roleNames` in
 * `backend/tests/e2e-skeleton-accounts.ts`; `E2eAccountsStore.create` fails when the two differ.
 * The model has the multi-tenant roles of the kit. A project with only staff roles lists its own
 * (`['administrator', 'operator']`), and a project without roles of the skeleton lists none and
 * keeps everything in the accounts above.
 */
export const PROJECT_E2E_ROLE_NAMES = [
  'platformOwner',
  'platformAdministrator',
  'staff',
  'nonStaff',
  'customer',
] as const satisfies ReadonlyArray<string>

/**
 * The account whose session is the default of the `playwright.config.ts` projects
 * (`E2eEnv.storageState`, DECISIONS.md #778). `null` keeps the skeleton's: the platform owner. A project
 * without the multi-tenant skeleton has no owner, so it names here one name of `PROJECT_E2E_ROLE_NAMES` or of the list above. It
 * is the project's file like the list: the sync never overwrites it.
 */
export const PROJECT_E2E_OWNER_ACCOUNT: string | null = null
