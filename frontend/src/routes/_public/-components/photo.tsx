import type * as React from 'react'

import { Picture } from '#/components/common/picture/picture'
import type { PicturePlacement } from '#/components/common/picture/picture'
import { AspectRatio } from '#/components/ui/aspect-ratio'
import { Button } from '#/components/ui/button'
import { localized } from '#/lib/i18n'
import { PHOTOS } from '#/lib/photos'
import type { PhotoKey } from '#/lib/photos'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

type PhotoProps = {
  name: PhotoKey
  /** A proporção do recorte; a foto preenche por `object-cover`. */
  ratio: number
  /** O `sizes` do `srcset`: quanto da tela a foto ocupa em cada largura. */
  sizes: string
  /** Só a foto da primeira dobra: carrega antes de tudo e é o LCP da página. */
  priority?: boolean
  className?: string
}

/** A posição pelo valor de `priority`, por lookup e não por ternário. */
const PLACEMENT = {
  true: 'lcp',
  false: 'fold',
} as const satisfies Record<`${boolean}`, PicturePlacement>

/**
 * Uma foto de terceiro com a legenda e o crédito que a licença pede.
 *
 * O crédito vem do registro (`lib/photos.ts`), e não de prop: a licença CC BY-SA
 * exige autor e licença junto da obra, e deixar isso para quem usa o
 * componente é como uma foto acaba publicada sem crédito.
 *
 * `width` e `height` vão no `Picture` para o navegador reservar o espaço antes de
 * baixar: sem eles a página pula quando a foto chega (CLS).
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
         * Button do ui/ e não `<a>` cru (#366). `min-h-11` porque o crédito
         * também é alvo de toque no celular (44px, WCAG 2.5.5); o tamanho do
         * texto segue o da legenda, não o do botão.
         */}
        <Button
          variant="link"
          nativeButton={false}
          className="h-auto min-h-11 px-0 text-small font-normal text-muted-foreground hover:text-foreground"
          render={
            <a
              href={photo.sourceUrl}
              target="_blank"
              rel="noopener noreferrer license"
            >
              {m.photo_credit({ author: photo.author, license: photo.license })}
            </a>
          }
        />
      </figcaption>
    </figure>
  )
}
