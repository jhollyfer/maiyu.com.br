import { SealCheckIcon } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

import logo from '#/assets/brand/logo.svg'

/**
 * The product's mark, read by `BrandMark` (`components/common/brand-mark/`) and by
 * `scripts/generate-icons.mjs`. It is the project's file (KIT.md §3.4): the sync creates this
 * skeleton when it is missing and never overwrites it, because the symbol is the product's.
 *
 * `icon` is the Phosphor symbol, drawn `fill` on a `bg-primary` disc, so the colors are the theme's
 * (`--primary`, `--primary-foreground`) and the app icons come out of the same two tokens. The name
 * is `brand_name` in the project's messages, not repeated here.
 *
 * `logo` is the project's own logo file (an import from `assets/brand/`), for when the owner
 * supplies one: it replaces the disc and the symbol on screen. Maiyu has one, the round symbol.
 */
export type Brand = Readonly<{ icon: Icon; logo?: string }>

export const BRAND: Brand = {
  icon: SealCheckIcon,
  logo,
}
