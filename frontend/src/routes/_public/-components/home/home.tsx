import { WhatsappLogoIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from '#/components/common/description-list/description-list'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/cn'
import { localized } from '#/lib/i18n'
import { MISSING, pendingApps } from '#/lib/pending-apps'
import { projects } from '#/lib/projects'
import { CALL_URL } from '#/lib/site'
import { m } from '#/paraglide/messages'
import type { ProjectStatus } from '@maiyu/shared'

/** The state of each project in words, by lookup (no ternary). */
const STATUS_LABEL = {
  production: () => m.home_status_production(),
  validation: () => m.home_status_validation(),
} satisfies Record<ProjectStatus, () => string>

type Row = {
  slug: string
  title: string
  url?: string
  summary: string
  client: string
  year: string
  status: string
  /** False while the owner has not sent the facts: the row shows one `[dado do dono]`, not three. */
  known: boolean
}

/** Every app of the house in one list: the ones with data first, the ones waiting for it after. */
function rows(): Row[] {
  const live = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    url: project.url,
    summary: localized(project.summary),
    client: localized(project.client),
    year: project.year,
    status: STATUS_LABEL[project.status](),
    known: true,
  }))
  const waiting = pendingApps.map((app) => ({
    slug: app.slug,
    title: app.title,
    url: app.url,
    summary: localized(app.summary),
    client: MISSING,
    year: MISSING,
    status: MISSING,
    known: false,
  }))

  return [...live, ...waiting]
}

/** The name, a link when the app has an address. */
function AppName({ row }: { row: Row }): React.JSX.Element {
  if (!row.url) return <>{row.title}</>

  return (
    <a
      href={row.url}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring underline underline-offset-4 hover:text-highlight"
    >
      {row.title}
      <span className="sr-only">{m.home_new_tab()}</span>
    </a>
  )
}

/** One app: the name as the link, what it solves, and the facts as a description list. */
function App({ row }: { row: Row }): React.JSX.Element {
  return (
    <li
      data-slot="home-app"
      className="grid gap-3 border-t border-border py-5 md:grid-cols-12 md:gap-x-8"
    >
      <h2 className="text-h4 md:col-span-3">
        <AppName row={row} />
      </h2>
      <p className="text-foreground md:col-span-4">{row.summary}</p>
      {row.known && (
        <DescriptionList className="gap-2 md:col-span-5">
          <DescriptionItem>
            <DescriptionTerm>{m.home_label_client()}</DescriptionTerm>
            <DescriptionDetails className="text-small">
              {row.client}
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>{m.home_label_year()}</DescriptionTerm>
            <DescriptionDetails className="tabular-nums">
              {row.year}
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>{m.home_label_status()}</DescriptionTerm>
            <DescriptionDetails className="text-small">
              {row.status}
            </DescriptionDetails>
          </DescriptionItem>
        </DescriptionList>
      )}
    </li>
  )
}

/**
 * The home, content first: the list of what we built, then who we are, then one way to talk to
 * us. No slogan, no hero image, no cards. The only action is the link at the end (the header has
 * the same one), as `docs/DESIGN.md` defines.
 */
export function Home(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 pb-24 md:px-8 md:pt-36">
      <section data-slot="home-apps">
        <h1 className="text-h1">{m.home_apps_title()}</h1>
        <p className="mt-3 max-w-[60ch] text-muted-foreground">
          {m.home_apps_intro()}
        </p>
        <ul className="mt-10">
          {rows().map((row) => (
            <App key={row.slug} row={row} />
          ))}
        </ul>
      </section>

      <section data-slot="home-about" className="mt-24 max-w-[60ch]">
        <h2 className="text-h2">{m.home_about_title()}</h2>
        <p className="mt-4">{m.home_about_p1()}</p>
        <p className="mt-3">{m.home_about_p2()}</p>
      </section>

      <section data-slot="home-contact" className="mt-24 max-w-[60ch]">
        <h2 className="text-h2">{m.home_contact_title()}</h2>
        <p className="mt-4">{m.home_contact_text()}</p>
        <a
          href={CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants(), 'mt-6 min-h-11')}
        >
          <WhatsappLogoIcon />
          {m.home_contact_cta()}
          <span className="sr-only">{m.home_new_tab()}</span>
        </a>
      </section>
    </div>
  )
}
