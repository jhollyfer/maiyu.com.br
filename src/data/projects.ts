import type { Language } from "@/contexts/language";

type LocalizedText = Record<Language, string>;

export type Project = {
  slug: string;
  title: string;
  client: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  image: string;
  /** CSS object-position that keeps the screenshot's headline in frame when cropped. */
  focus?: string;
  tech: string[];
  url: string;
  year: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "adacaibs",
    title: "ADACAIBS",
    client: {
      en: "Indigenous association · Benjamin Constant",
      "pt-BR": "Associação indígena · Benjamin Constant",
      es: "Asociación indígena · Benjamin Constant",
    },
    summary: {
      en: "Association management platform for an indigenous community.",
      "pt-BR": "Plataforma de gestão para uma associação indígena.",
      es: "Plataforma de gestión para una asociación indígena.",
    },
    description: {
      en: "A full-stack association management platform for the indigenous community of Benjamin Constant. Member registry, document handling, internal reporting and governance tooling, built to be maintained by the community itself.",
      "pt-BR": "Plataforma full-stack de gestão para a associação da comunidade indígena de Benjamin Constant. Cadastro de membros, gestão de documentos, relatórios internos e ferramentas de governança, pensada para ser mantida pela própria comunidade.",
      es: "Plataforma full-stack de gestión para la asociación de la comunidad indígena de Benjamin Constant. Registro de miembros, gestión documental, reportes internos y herramientas de gobernanza, pensada para ser mantenida por la propia comunidad.",
    },
    image: "/images/adacaibs.webp",
    focus: "left center",
    tech: ["React", "AdonisJS", "TanStack Query", "PostgreSQL", "Tailwind CSS"],
    url: "https://adacaibs.com.br",
    year: "2024",
    featured: true,
  },
  {
    slug: "matiscraft",
    title: "MatisCraft",
    client: {
      en: "Matis artisans cooperative",
      "pt-BR": "Cooperativa de artesãos Matis",
      es: "Cooperativa de artesanos Matis",
    },
    summary: {
      en: "E-commerce for indigenous handcraft from the Matis people.",
      "pt-BR": "E-commerce de artesanato indígena do povo Matis.",
      es: "E-commerce de artesanía indígena del pueblo Matis.",
    },
    description: {
      en: "An e-commerce platform for indigenous handcraft from the Matis people. Product catalogue, cart, order management and a back-office the artisans themselves can operate, direct market access, no middle layer.",
      "pt-BR": "Plataforma de e-commerce para artesanato indígena do povo Matis. Catálogo de produtos, carrinho, gestão de pedidos e back-office que os próprios artesãos operam, acesso direto ao mercado, sem camada intermediária.",
      es: "Plataforma de e-commerce para artesanía indígena del pueblo Matis. Catálogo de productos, carrito, gestión de pedidos y back-office que los propios artesanos operan, acceso directo al mercado, sin capa intermedia.",
    },
    image: "/images/matis.webp",
    focus: "left bottom",
    tech: ["React", "Fastify", "Prisma", "PostgreSQL", "Tailwind CSS"],
    url: "https://matis.maiyu.com.br",
    year: "2024",
  },
  {
    slug: "manganga",
    title: "Manganga",
    client: {
      en: "Cultural preservation collective",
      "pt-BR": "Coletivo de preservação cultural",
      es: "Colectivo de preservación cultural",
    },
    summary: {
      en: "Digital platform for cultural preservation and community engagement.",
      "pt-BR": "Plataforma digital para preservação cultural e engajamento comunitário.",
      es: "Plataforma digital para preservación cultural y participación comunitaria.",
    },
    description: {
      en: "A digital platform for cultural preservation and community engagement in the Amazon region. Content management, event organisation, and a public-facing archive that communities can curate themselves over time.",
      "pt-BR": "Plataforma digital para preservação cultural e engajamento comunitário na região amazônica. Gestão de conteúdo, organização de eventos e um arquivo público que as comunidades curam ao longo do tempo.",
      es: "Plataforma digital para preservación cultural y participación comunitaria en la región amazónica. Gestión de contenido, organización de eventos y un archivo público que las comunidades curan con el tiempo.",
    },
    image: "/images/manganga.webp",
    focus: "57% center",
    tech: ["React", "Fastify", "Prisma", "PostgreSQL", "Tailwind CSS"],
    url: "https://manganga.maiyu.com.br",
    year: "2025",
  },
];

export const featuredProject = projects.find((p) => p.featured) ?? projects[0];
