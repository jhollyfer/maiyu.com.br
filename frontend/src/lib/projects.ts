import academyShot from '#/assets/projects/academy.webp'
import adacaibsShot from '#/assets/projects/adacaibs.webp'
import aportaShot from '#/assets/projects/aporta.webp'
import curupiraShot from '#/assets/projects/curupira.webp'
import interclasseShot from '#/assets/projects/interclasse.webp'
import type { LocalizedText, ProjectStatus } from '@maiyu/shared'

/**
 * Maiyu's live projects, in the order they appear on the home and in the portfolio. Content in
 * code, like `articles.ts`.
 */

export type Project = {
  slug: string
  title: string
  client: LocalizedText
  summary: LocalizedText
  description: LocalizedText
  image: string
  /** The `object-position` that keeps the screenshot's headline framed in the crop. */
  focus?: string
  tech: string[]
  url: string
  year: string
  /** Live or still in validation with whoever will use it (`PROJECT_STATUS`). */
  status: ProjectStatus
  featured?: boolean
}

/**
 * A non-empty tuple, not `ReadonlyArray`: with `noUncheckedIndexedAccess`, `projects[0]` and the
 * home's `[lead, ...rest]` would be typed `Project | undefined`. The type keeps what the screen
 * assumes (there is at least one project), and the compiler rejects the empty registry.
 */
export const projects: readonly [Project, ...Project[]] = [
  {
    slug: 'adacaibs',
    title: 'ADACAIBS',
    client: {
      en: 'Ticuna association · Belém do Solimões',
      'pt-BR': 'Associação Ticuna · Belém do Solimões',
      es: 'Asociación Ticuna · Belém do Solimões',
    },
    summary: {
      en: 'Association management platform for an indigenous community.',
      'pt-BR': 'Plataforma de gestão para uma associação indígena.',
      es: 'Plataforma de gestión para una asociación indígena.',
    },
    description: {
      en: 'An association management platform for the Ticuna association of the Belém do Solimões village. Member registry, document handling, internal reporting and governance tooling, built to be maintained by the community itself.',
      'pt-BR':
        'Plataforma de gestão para a associação do povo Ticuna da aldeia Belém do Solimões. Cadastro de membros, gestão de documentos, relatórios internos e ferramentas de governança, pensada para ser mantida pela própria comunidade.',
      es: 'Plataforma de gestión para la asociación del pueblo Ticuna de la aldea Belém do Solimões. Registro de miembros, gestión documental, reportes internos y herramientas de gobernanza, pensada para ser mantenida por la propia comunidad.',
    },
    image: adacaibsShot,
    focus: 'left center',
    tech: ['React', 'AdonisJS', 'TanStack Query', 'PostgreSQL', 'Tailwind CSS'],
    url: 'https://adacaibs.com.br',
    year: '2024',
    status: 'production',
    featured: true,
  },
  {
    slug: 'academy',
    title: 'Maiyu Academy',
    client: {
      en: 'A Maiyu initiative · Free technology education',
      'pt-BR': 'Iniciativa da Maiyu · Ensino gratuito de tecnologia',
      es: 'Iniciativa de Maiyu · Enseñanza gratuita de tecnología',
    },
    summary: {
      en: 'Free technology courses, taught by people native to the Amazon.',
      'pt-BR': 'Ensino gratuito de tecnologia, dado por quem é da Amazônia.',
      es: 'Enseñanza gratuita de tecnología, a cargo de gente de la Amazonía.',
    },
    description: {
      en: 'Our own initiative: a free platform for learning robotics and programming logic, for Indigenous and non-Indigenous students, in Portuguese, Spanish and English. Lessons stay open online, and in-person classes run in the Upper Solimões. The team that builds the platform is the one that teaches.',
      'pt-BR':
        'Uma iniciativa da própria Maiyu: plataforma gratuita para aprender robótica e lógica de programação, para indígenas e não indígenas, em português, espanhol e inglês. As aulas ficam abertas na plataforma, e as turmas presenciais acontecem no Alto Solimões. Quem constrói a plataforma é quem dá aula.',
      es: 'Una iniciativa de la propia Maiyu: plataforma gratuita para aprender robótica y lógica de programación, para indígenas y no indígenas, en portugués, español e inglés. Las clases quedan abiertas en la plataforma, y los grupos presenciales funcionan en el Alto Solimões. Quien construye la plataforma es quien da clase.',
    },
    image: academyShot,
    tech: ['TanStack Start', 'AdonisJS', 'PostgreSQL'],
    url: 'https://academy.maiyu.com.br',
    year: '2026',
    status: 'production',
  },
  {
    slug: 'aporta',
    title: 'Aporta',
    client: {
      en: 'Housing and city guide · Benjamin Constant',
      'pt-BR': 'Moradia e guia da cidade · Benjamin Constant',
      es: 'Vivienda y guía de la ciudad · Benjamin Constant',
    },
    summary: {
      en: 'Find a place to live in Benjamin Constant, straight from the owner.',
      'pt-BR': 'Onde morar em Benjamin Constant, direto com o dono.',
      es: 'Dónde vivir en Benjamin Constant, directo con el dueño.',
    },
    description: {
      en: 'Houses, flats, kitnets, rooms and hotels with direct WhatsApp contact with the owner, for UFAM freshmen, public servants, travellers and festival visitors, plus a city guide. Before it, listings vanished in group chats; now they stay findable by neighbourhood, price and period.',
      'pt-BR':
        'Casas, apartamentos, kitnets, quartos e hotéis com contato direto com o dono pelo WhatsApp, para calouros da UFAM, servidores, viajantes e quem vem para o festival, e um guia da cidade. Antes o anúncio sumia nos grupos; agora fica achável por bairro, preço e período.',
      es: 'Casas, apartamentos, kitnets, habitaciones y hoteles con contacto directo con el dueño por WhatsApp, para estudiantes de la UFAM, servidores, viajeros y visitantes del festival, y una guía de la ciudad. Antes el anuncio se perdía en los grupos; ahora se encuentra por barrio, precio y período.',
    },
    image: aportaShot,
    tech: ['TanStack Start', 'AdonisJS', 'PostgreSQL', 'Leaflet'],
    url: 'https://aporta.maiyu.com.br',
    year: '2026',
    status: 'validation',
  },
  {
    slug: 'curupira',
    title: 'Curupira',
    client: {
      en: 'Public service · Benjamin Constant',
      'pt-BR': 'Serviço público · Benjamin Constant',
      es: 'Servicio público · Benjamin Constant',
    },
    summary: {
      en: 'Waste collection schedule and anonymous environmental reports.',
      'pt-BR': 'Coleta de lixo por bairro e denúncia ambiental anônima.',
      es: 'Recolección de basura por barrio y denuncia ambiental anónima.',
    },
    description: {
      en: 'Residents check when collection passes in their neighbourhood and report fires, illegal dumping and deforestation with a photo and a map pin, without exposing themselves, then follow it by protocol. The municipal team gets one panel to handle reports and publish notices. Installable app, in Portuguese, Spanish and English.',
      'pt-BR':
        'O morador consulta quando a coleta passa no seu bairro e denuncia queimada, descarte irregular e desmatamento com foto e ponto no mapa, sem se expor, e acompanha pelo protocolo. A gestão municipal ganha um painel só para tratar as ocorrências e publicar avisos. App instalável, em português, espanhol e inglês.',
      es: 'El vecino consulta cuándo pasa la recolección en su barrio y denuncia quemas, botaderos ilegales y deforestación con foto y punto en el mapa, sin exponerse, y sigue el caso por protocolo. La gestión municipal tiene un solo panel para atender los casos y publicar avisos. App instalable, en portugués, español e inglés.',
    },
    image: curupiraShot,
    tech: ['TanStack Start', 'AdonisJS', 'PostgreSQL', 'PWA'],
    url: 'https://curupira.maiyu.com.br',
    year: '2026',
    status: 'validation',
  },
  {
    slug: 'interclasse',
    title: 'Jogos Estudantis',
    client: {
      en: 'School games · CMEI Cosme Jean',
      'pt-BR': 'Jogos escolares · CMEI Cosme Jean',
      es: 'Juegos escolares · CMEI Cosme Jean',
    },
    summary: {
      en: 'Athlete sign-up, draw, fixtures and live standings for the school games.',
      'pt-BR':
        'Inscrição, sorteio, tabela e classificação dos jogos da escola.',
      es: 'Inscripción, sorteo, tabla y clasificación de los juegos escolares.',
    },
    description: {
      en: 'The school games used to live on paper and spreadsheets. Now teachers sign up their classes, the organisers run the draw and the scores in one system, and students and families follow the next match and the standings on an open site.',
      'pt-BR':
        'Os jogos da escola viviam em papel e planilha. Agora o professor inscreve a turma, a organização faz o sorteio e lança o placar num sistema só, e alunos e famílias acompanham o próximo jogo e a classificação num site aberto.',
      es: 'Los juegos de la escuela vivían en papel y planillas. Ahora el profesor inscribe al curso, la organización hace el sorteo y carga el marcador en un solo sistema, y alumnos y familias siguen el próximo partido y la clasificación en un sitio abierto.',
    },
    image: interclasseShot,
    tech: ['TanStack Start', 'AdonisJS', 'PostgreSQL'],
    url: 'https://interclass.maiyu.com.br',
    year: '2026',
    status: 'validation',
  },
]

/** The featured case study in the portfolio: the flagged one, or the first. */
const flaggedProject = projects.find((project) => project.featured)
let leadProject = projects[0]
if (flaggedProject) leadProject = flaggedProject
export const featuredProject = leadProject
