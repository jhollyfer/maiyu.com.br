import town1280 from '#/assets/photos/benjamin-constant-1280.webp'
import town1920 from '#/assets/photos/benjamin-constant-1920.webp'
import town640 from '#/assets/photos/benjamin-constant-640.webp'
import sunset1280 from '#/assets/photos/leticia-1280.webp'
import sunset1920 from '#/assets/photos/leticia-1920.webp'
import sunset640 from '#/assets/photos/leticia-640.webp'
import river1280 from '#/assets/photos/rio-solimoes-1280.webp'
import river1920 from '#/assets/photos/rio-solimoes-1920.webp'
import river640 from '#/assets/photos/rio-solimoes-640.webp'
import type { LocalizedText } from '@maiyu/shared'

/**
 * The third-party photos the site publishes, with the credit the license requires.
 *
 * Maiyu does not have its own collection yet, so the showcase uses landscapes of the place (river,
 * city, border) from Wikimedia Commons, under a free license. The face of an indigenous person does
 * not go in: a stock photo does not carry the consent of whoever appears, and the site is precisely
 * about respect for these peoples.
 *
 * Every new photo goes in here, with author, license and source page: the caption (`Photo`) reads
 * the credit from this registry, and a photo without a credit cannot be drawn.
 */
export type Photo = {
  /** The 1280 px file, the one in the `img` `src`. */
  src: string
  /** The three sizes (640, 1280 and 1920 px) in the `srcset` format, imported from `src/assets` to get a hash. */
  srcSet: string
  width: number
  height: number
  alt: LocalizedText
  caption: LocalizedText
  author: string
  license: string
  licenseUrl: string
  sourceUrl: string
}

export const PHOTOS = {
  town: {
    src: town1280,
    srcSet: `${town640} 640w, ${town1280} 1280w, ${town1920} 1920w`,
    width: 1920,
    height: 1080,
    alt: {
      'pt-BR':
        'Margem do rio em Benjamin Constant, Amazonas, com casas e barcos',
      en: 'Riverbank in Benjamin Constant, Amazonas, with houses and boats',
      es: 'Orilla del río en Benjamin Constant, Amazonas, con casas y barcos',
    },
    caption: {
      'pt-BR': 'Benjamin Constant, Amazonas, onde a Maiyu nasceu.',
      en: 'Benjamin Constant, Amazonas, where Maiyu was born.',
      es: 'Benjamin Constant, Amazonas, donde nació Maiyu.',
    },
    author: 'Ridiculopathy',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=149127809',
  },
  river: {
    src: river1280,
    srcSet: `${river640} 640w, ${river1280} 1280w, ${river1920} 1920w`,
    width: 1920,
    height: 1080,
    alt: {
      'pt-BR':
        'Barco de recreio atracado no rio Solimões, em Benjamin Constant, com flutuantes e casas na margem',
      en: 'Passenger riverboat moored on the Solimões in Benjamin Constant, with floating docks and houses on the bank',
      es: 'Barco de pasajeros atracado en el río Solimões, en Benjamin Constant, con muelles flotantes y casas en la orilla',
    },
    caption: {
      'pt-BR':
        'O recreio no porto de Benjamin Constant: o rio é a estrada da região.',
      en: 'A riverboat at the port of Benjamin Constant: the river is the road here.',
      es: 'Un barco en el puerto de Benjamin Constant: el río es la carretera de la región.',
    },
    author: 'Ridiculopathy',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=149127797',
  },
  sunset: {
    src: sunset1280,
    srcSet: `${sunset640} 640w, ${sunset1280} 1280w, ${sunset1920} 1920w`,
    width: 1920,
    height: 1080,
    alt: {
      'pt-BR':
        'Fim de tarde numa rua de Letícia, na Colômbia, com o sol baixo entre as árvores e motos passando',
      en: 'Late afternoon on a street in Leticia, Colombia, with the low sun between the trees and motorbikes passing',
      es: 'Atardecer en una calle de Leticia, Colombia, con el sol bajo entre los árboles y motos pasando',
    },
    caption: {
      'pt-BR':
        'Fim de tarde em Letícia, na Colômbia, a poucos minutos de Tabatinga.',
      en: 'Late afternoon in Leticia, Colombia, a few minutes from Tabatinga.',
      es: 'Atardecer en Leticia, Colombia, a pocos minutos de Tabatinga.',
    },
    author: 'Ridiculopathy',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=149106962',
  },
} as const satisfies Record<string, Photo>

export type PhotoKey = keyof typeof PHOTOS
