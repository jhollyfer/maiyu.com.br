import type * as React from 'react'

import { Picture } from '#/components/common/picture/picture'
import type { PicturePlacement } from '#/components/common/picture/picture'
import { AspectRatio } from '#/components/ui/aspect-ratio'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/cn'
import { localized } from '#/lib/i18n'
import { PHOTOS } from '#/lib/photos'
import type { PhotoKey } from '#/lib/photos'
import { m } from '#/paraglide/messages'

type PhotoProps = {
  name: PhotoKey
  /** The aspect ratio of the crop; the photo fills it through `object-cover`. */
  ratio: number
  /** The `sizes` of the `srcset`: how much of the screen the photo takes at each width. */
  sizes: string
  /** Only the above-the-fold photo: loads before everything and is the page's LCP. */
  priority?: boolean
  className?: string
}

/** The position from the `priority` value, through a lookup and not a ternary. */
const PLACEMENT = {
  true: 'lcp',
  false: 'fold',
} as const satisfies Record<`${boolean}`, PicturePlacement>

/**
 * A third-party photo with the caption and the credit the license asks for.
 *
 * The credit comes from the registry (`lib/photos.ts`), and not from a prop: the CC BY-SA license
 * requires author and license alongside the work, and leaving that to whoever uses the
 * component is how a photo ends up published without credit.
 *
 * `width` and `height` go in `Picture` so the browser reserves the space before
 * downloading: without them the page jumps when the photo arrives (CLS).
 */
export function Photo({
  name,
  ratio,
  sizes,
  priority = false,
  className,
}: PhotoProps): React.JSX.Element {
  const photo = PHOTOS[name]
  const placement = PLACEMENT[`${priority}`]

  return (
    <figure data-slot="photo" className={cn('flex flex-col gap-3', className)}>
      <AspectRatio
        ratio={ratio}
        className="overflow-hidden rounded-[1.25rem] bg-secondary"
      >
        <Picture
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={sizes}
          width={photo.width}
          height={photo.height}
          alt={localized(photo.alt)}
          placement={placement}
          className="size-full object-cover"
        />
      </AspectRatio>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-small text-muted-foreground">
        <span>{localized(photo.caption)}</span>
        {/*
         * The link element itself with `buttonVariants`, and not `Button render={<a/>}`:
         * Base UI would force `role="button"` and erase the link (#440). `min-h-11` on every
         * width, not only below `sm`: the `ui/` touch patch (#461) already gives 44px on the
         * phone, but the credit keeps 44px on the desktop too, as it always had, so the
         * desktop layout does not move. The text size follows the caption's, not the button's.
         */}
        <a
          href={photo.sourceUrl}
          target="_blank"
          rel="noopener noreferrer license"
          className={cn(
            buttonVariants({ variant: 'link' }),
            'h-auto min-h-11 px-0 text-small font-normal text-muted-foreground hover:text-foreground',
          )}
        >
          {m.photo_credit({ author: photo.author, license: photo.license })}
        </a>
      </figcaption>
    </figure>
  )
}
