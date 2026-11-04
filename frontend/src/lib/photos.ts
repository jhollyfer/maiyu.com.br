import type { LocalizedText } from './i18n'

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
  /** O caminho sem a largura: os arquivos são `<src>-640.webp`, `-1280` e `-1920`. */
  src: string
  width: number
  height: number
  alt: LocalizedText
  caption: LocalizedText
  author: string
  license: string
  licenseUrl: string
  sourceUrl: string
}

/** As larguras geradas de cada foto, para o `srcset`. */
export const PHOTO_WIDTHS = [640, 1280, 1920] as const

export const PHOTOS = {
  town: {
    src: '/images/photos/benjamin-constant',
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
    src: '/images/photos/rio-solimoes',
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
    src: '/images/photos/leticia',
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
