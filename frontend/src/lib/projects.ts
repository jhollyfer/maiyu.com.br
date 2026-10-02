import type { LocalizedText } from './i18n'

/**
 * Os projetos da Maiyu no ar, na ordem em que aparecem na home e no
 * portfólio. Conteúdo em código, como `articles.ts`.
 */

export type Project = {
  slug: string
  title: string
  client: LocalizedText
  summary: LocalizedText
  description: LocalizedText
  image: string
  /** O `object-position` que mantém a manchete do print enquadrada no recorte. */
  focus?: string
  tech: string[]
  url: string
  year: string
  featured?: boolean
}

export const projects: ReadonlyArray<Project> = [
  {
    slug: 'adacaibs',
    title: 'ADACAIBS',
    client: {
      en: 'Indigenous association · Benjamin Constant',
      'pt-BR': 'Associação indígena · Benjamin Constant',
      es: 'Asociación indígena · Benjamin Constant',
    },
    summary: {
      en: 'Association management platform for an indigenous community.',
      'pt-BR': 'Plataforma de gestão para uma associação indígena.',
      es: 'Plataforma de gestión para una asociación indígena.',
    },
    description: {
      en: 'A full-stack association management platform for the indigenous community of Benjamin Constant. Member registry, document handling, internal reporting and governance tooling, built to be maintained by the community itself.',
      'pt-BR':
        'Plataforma full-stack de gestão para a associação da comunidade indígena de Benjamin Constant. Cadastro de membros, gestão de documentos, relatórios internos e ferramentas de governança, pensada para ser mantida pela própria comunidade.',
      es: 'Plataforma full-stack de gestión para la asociación de la comunidad indígena de Benjamin Constant. Registro de miembros, gestión documental, reportes internos y herramientas de gobernanza, pensada para ser mantenida por la propia comunidad.',
    },
    image: '/images/adacaibs.webp',
    focus: 'left center',
    tech: ['React', 'AdonisJS', 'TanStack Query', 'PostgreSQL', 'Tailwind CSS'],
    url: 'https://adacaibs.com.br',
    year: '2024',
    featured: true,
  },
  {
    slug: 'matiscraft',
    title: 'MatisCraft',
    client: {
      en: 'Matis artisans cooperative',
      'pt-BR': 'Cooperativa de artesãos Matis',
      es: 'Cooperativa de artesanos Matis',
    },
    summary: {
      en: 'E-commerce for indigenous handcraft from the Matis people.',
      'pt-BR': 'E-commerce de artesanato indígena do povo Matis.',
      es: 'E-commerce de artesanía indígena del pueblo Matis.',
    },
    description: {
      en: 'An e-commerce platform for indigenous handcraft from the Matis people. Product catalogue, cart, order management and a back-office the artisans themselves can operate, direct market access, no middle layer.',
      'pt-BR':
        'Plataforma de e-commerce para artesanato indígena do povo Matis. Catálogo de produtos, carrinho, gestão de pedidos e back-office que os próprios artesãos operam, acesso direto ao mercado, sem camada intermediária.',
      es: 'Plataforma de e-commerce para artesanía indígena del pueblo Matis. Catálogo de productos, carrito, gestión de pedidos y back-office que los propios artesanos operan, acceso directo al mercado, sin capa intermedia.',
    },
    image: '/images/matis.webp',
    focus: 'left bottom',
    tech: ['React', 'Fastify', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
    url: 'https://matis.maiyu.com.br',
    year: '2024',
  },
]

/** O estudo de caso em destaque no portfólio: o marcado, ou o primeiro. */
export const featuredProject =
  projects.find((project) => project.featured) ?? projects[0]
