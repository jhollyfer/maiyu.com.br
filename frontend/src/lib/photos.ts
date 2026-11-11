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
 * As fotos de terceiros que o site publica, com o crédito que a licença exige.
 *
 * A Maiyu ainda não tem acervo próprio, então a vitrine usa paisagem do lugar
 * (rio, cidade, fronteira) do Wikimedia Commons, em licença livre. Rosto de
 * pessoa indígena não entra: foto de banco não traz o consentimento de quem
 * aparece, e o site fala justamente de respeito a esses povos.
 *
 * Toda foto nova entra aqui, com autor, licença e página de origem: a legenda
 * (`Photo`) lê o crédito deste registro, e foto sem crédito não tem como ser
 * desenhada.
 */
export type Photo = {
  /** O arquivo de 1280 px, o do `src` do `img`. */
  src: string
  /** Os três tamanhos (640, 1280 e 1920 px) no formato do `srcset`, importados de `src/assets` para ganhar hash. */
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
