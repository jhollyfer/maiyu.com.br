import type { Language } from "@/contexts/language";

type LocalizedText = Record<Language, string>;

export type Category = "all" | "tech" | "design" | "marketing";

export type Article = {
  slug: string;
  category: Category;
  title: LocalizedText;
  excerpt: LocalizedText;
  author: string;
  role: LocalizedText;
  date: string;
  readTime: LocalizedText;
  image: string;
  authorImg: string;
  featured?: boolean;
};

export const categories: Category[] = ["all", "tech", "design", "marketing"];

export const articles: Article[] = [
  {
    slug: "future-digital-design",
    category: "design",
    featured: true,
    title: {
      en: "Exploring the future of digital design and innovation",
      "pt-BR": "Explorando o futuro do design digital e da inovação",
      es: "Explorando el futuro del diseño digital y la innovación",
    },
    excerpt: {
      en: "How emerging technologies and deliberate craft are reshaping the creative landscape from the ground up.",
      "pt-BR": "Como tecnologias emergentes e ofício deliberado estão remodelando o cenário criativo de baixo pra cima.",
      es: "Cómo las tecnologías emergentes y el oficio deliberado están remodelando el panorama creativo desde la base.",
    },
    author: "Sarah Jenkins",
    role: {
      en: "Senior Design Lead",
      "pt-BR": "Líder de Design Sênior",
      es: "Líder de Diseño Senior",
    },
    date: "2024-05-15",
    readTime: {
      en: "5 min read",
      "pt-BR": "5 min de leitura",
      es: "5 min de lectura",
    },
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuChAIb-bVeygz_--3Dp3D-p61O4uz4HiRggsPbbqVJRMPzagnn-Aucnk_YAzYryUFxAsS-XmAie2drRCH2SBEzkO5O7yEjfQfENcGOWnc6k9KW0RAqG5ZHDbUQxjhQB0NuEYWx6MPvMR-EstKRErOzQY5HxlexX9A4CdxgzgebOaMk-RwMlLcYdHq4vo2X0J2Ale22j0jdjJawD_ZTToiSiUd5x6osrdXPmyfOOqud8OrdHcqRg6fPtMfabadWBYPQq4o21WhLymAY",
    authorImg:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDxfSwKe_Nu3dY3jNDtpq5SjOZM9n77ynyexZaD9Qlb4KO0UGzskiUAyR4l4eYkbPzhkE9O3TAk8OrQrJ_c8xMtMvYJI7kTyIrLEwhqSsghRF5MYN3jrmmLh91iThH6vGbj4gOSvkEEvAUVcrT8TH5oBK2VbR3VjwX-t6nsdAhCxZjbEJzfuhD5-u7gsTLLI9CeB75qRL_t4q4bBq5HEoyoLeLMjONH7SscqM9NWbXWLl_Hm6QN9GDpRrJh9lUG1yQclB8-4SySzjc",
  },
  {
    slug: "dark-mode-web-applications",
    category: "marketing",
    title: {
      en: "The evolution of dark mode in modern web applications",
      "pt-BR": "A evolução do modo escuro em aplicações web modernas",
      es: "La evolución del modo oscuro en las aplicaciones web modernas",
    },
    excerpt: {
      en: "A deep dive into the psychological benefits and technical challenges of implementing dark themes for global audiences.",
      "pt-BR": "Um mergulho fundo nos benefícios psicológicos e desafios técnicos de implementar temas escuros para audiências globais.",
      es: "Una inmersión profunda en los beneficios psicológicos y los desafíos técnicos de implementar temas oscuros para audiencias globales.",
    },
    author: "Mark Thompson",
    role: {
      en: "Lead Developer",
      "pt-BR": "Desenvolvedor Líder",
      es: "Desarrollador Líder",
    },
    date: "2024-02-12",
    readTime: {
      en: "4 min read",
      "pt-BR": "4 min de leitura",
      es: "4 min de lectura",
    },
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDPqAMqRN1xEbhy3KniUJbJOg39ifkLg5-726tnlH0u9zmXfOn8zTmRqAt56WHRTyxf5exYJfMjltUdlhaYnZG9GyHM68wjfNfxvGo1B8m-K_oHqpRkk45IOQP_F1JDB8LfdoW9dYiOw-9jVq49gwJ88jagynR9lEF_BrU-L5WePy49VRCGULRXZQtafZgeqp4U-91iqwqYjbZYkJTPMjz5S9jr3bm5gJ0MI6D7jjQrgcwE9k6sPNtFiyjz_fBFhLbyhw5WkVA2p34",
    authorImg:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDc4Htsi6R1hmJ6l-Bre8JhuP8_ljraYi-WrqqShDl6YY6axtIH1Xk9JRIk2Ud_nUzxF0Ze5yCi2SEkAmGfuaxCWxfZDm6iu9WvbMN99DqY9YTblnBJSc0-oBJeh6H81YkpAZCyHucw5bXx_DjwGtEnCqmSdr9UtZQNY7Ea-C-RS-btchvpcE0N_xNCsIa1NJY19yCIfPa7TxdSHG5P1oz-HaIaK01TtiuA0Yu3WnReABWhq9iEhcHhi30Swq39XM0wUEfSopWZ-J8",
  },
  {
    slug: "high-conversion-landing-pages",
    category: "design",
    title: {
      en: "Ten principles of high-conversion landing pages",
      "pt-BR": "Dez princípios de landing pages de alta conversão",
      es: "Diez principios de landing pages de alta conversión",
    },
    excerpt: {
      en: "How the most successful product companies structure their top-of-funnel experiences for maximum signal and minimum friction.",
      "pt-BR": "Como as empresas de produto mais bem-sucedidas estruturam suas experiências de topo de funil para máximo sinal e mínima fricção.",
      es: "Cómo las empresas de producto más exitosas estructuran sus experiencias de top of funnel para máxima señal y mínima fricción.",
    },
    author: "Elena Rodriguez",
    role: {
      en: "Growth Designer",
      "pt-BR": "Designer de Growth",
      es: "Diseñadora de Growth",
    },
    date: "2024-02-08",
    readTime: {
      en: "12 min read",
      "pt-BR": "12 min de leitura",
      es: "12 min de lectura",
    },
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8BvwvLMJVSma-8MlmspW2hKcyQBEL64MK17frR-lhy57g5evEtbQ91UdEneCVIsKLwIRNk4nv3nuZGppav7DxE2gXGsVyRULW4bj9ER4Bcz0uRur6sfdmnv5WN5z7OsaIvK2nsnyY5pCoc65ROqQg51lhji4otOxnHY7Yqon_U2d9r38ZRQfJpMtFHDLRSFlr7yJzR13S7MpJoTc6FYepjp0HcW5e_PMsHRFMVXM3YXS09mf7DZ_bLTzMN2h3nmH3UNjKQHJ---o",
    authorImg:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAhLpj1OXKAICPN8UKjFtBAruoJUQ3BGy9lUiM23vayw16wMPjjpEKJ6gT_isKyQpo6DllAQBoyA4_1bZJFTY9P40NdYyRSRLTxnRHQ5wjDe0e_FYe9W_llYIszAglpoykcKyRNTV0nynqjGLmCQ0kRu6sFoTFlGezWtTgsOv3DYLgU7AwTDuISjm65jsRu2mNg2qralJL_IyH5bMOtti_3AE2dW_2KoyrJbYzB7FYDiSTpO5B04ybpf3gCrBU9Cw9hsBR4F8CWBPY",
  },
  {
    slug: "micro-interactions-user-loyalty",
    category: "tech",
    title: {
      en: "Micro-interactions: the quiet secret to user loyalty",
      "pt-BR": "Micro-interações: o segredo silencioso da fidelidade",
      es: "Micro-interacciones: el secreto silencioso de la fidelidad",
    },
    excerpt: {
      en: "Small details are never small. Discover how subtle animations and considered feedback can change how users feel about a product.",
      "pt-BR": "Detalhes pequenos nunca são pequenos. Descubra como animações sutis e feedback considerado podem mudar como os usuários sentem um produto.",
      es: "Los detalles pequeños nunca son pequeños. Descubre cómo las animaciones sutiles y el feedback considerado pueden cambiar cómo los usuarios sienten un producto.",
    },
    author: "James Wilson",
    role: {
      en: "UX Engineer",
      "pt-BR": "Engenheiro de UX",
      es: "Ingeniero de UX",
    },
    date: "2024-01-30",
    readTime: {
      en: "6 min read",
      "pt-BR": "6 min de leitura",
      es: "6 min de lectura",
    },
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCojBiZ6ClfedLLQe0K1SaZsl21GNz2FEAbS_EKXBFND_g4gB3fzD0O1zQ3ibRqjpEtMZEMy-nTueHqVkkHlEZQwzFDjhQgtyJCyzdGbz111dSQLjQzEVyxAm1JwW_js6h79EAY6WH6_iOoWbZnqUM4nsrFsqnPbOGHFW7K35LHrGJfHtaGVP6JhS-xoXq85_MJm9t0G0f3-FT6TfOVm27M72ozq3Ulc__3lLHi0dc33dsUscmXrZ8AwVkdot-TAAMDgieN5J69tJk",
    authorImg:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOCmjCIwUiZlphcf3jqXj83hVAeKQQ5_2uGKHLo-_Lq7GA-2CzzIc60eeK_8SlK7WRkMbUg0sD7JatmRvZs22-IV4oewwCwD31SvHGQmPydCGNEGZ_fT42JWQFvwE8X6_M9bB_8TfHbHhwLW1--ML3oznAf83t1hnyWgrsKa6fZBKUQWMbJiObXrsb0D5VTozPgyBmUkocHLKVXF2NhohX13ivknjmwd5JivDNtglgdIJB7qYMpXwPCYOjmJcA_gpnR-_Tv-zNBPg",
  },
  {
    slug: "next-gen-tech-marketing",
    category: "marketing",
    title: {
      en: "How Maiyu is shaping the next generation of tech storytelling",
      "pt-BR": "Como a Maiyu está moldando a próxima geração de storytelling tech",
      es: "Cómo Maiyu está moldeando la próxima generación del storytelling tech",
    },
    excerpt: {
      en: "A deep dive into the intersection of deliberate craft and data-driven practice across our recent work.",
      "pt-BR": "Um mergulho na interseção entre ofício deliberado e prática guiada por dados ao longo do nosso trabalho recente.",
      es: "Una inmersión en la intersección entre oficio deliberado y práctica guiada por datos a lo largo de nuestro trabajo reciente.",
    },
    author: "Sarah Jenkins",
    role: {
      en: "Senior Design Lead",
      "pt-BR": "Líder de Design Sênior",
      es: "Líder de Diseño Senior",
    },
    date: "2024-01-24",
    readTime: {
      en: "8 min read",
      "pt-BR": "8 min de leitura",
      es: "8 min de lectura",
    },
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDB0i68V69E2e0FkNjQO-mAM00Ueh__kkm7Peh5Uin5452L5hFyHbP-7Lvkvb1pKLjW3c5uFCKlY22UTmV-XlkKc_XE6xndApFLuia-QPC_i5De0hBi4M3evEuTQad-F1CcJ08CEPjvbBT1F84z5_oR-cnBw0ucgghP6uQj0eVlHlN0YaeSa_-HqlDBJk5okIQVkkVPLyciVfz2lzI3FCDK5ZqI2Q7JkJIZIC57XjoLCdyCN8zi7EaPvAgZF1lC4umXzJ0DbnLtt6c",
    authorImg:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDxfSwKe_Nu3dY3jNDtpq5SjOZM9n77ynyexZaD9Qlb4KO0UGzskiUAyR4l4eYkbPzhkE9O3TAk8OrQrJ_c8xMtMvYJI7kTyIrLEwhqSsghRF5MYN3jrmmLh91iThH6vGbj4gOSvkEEvAUVcrT8TH5oBK2VbR3VjwX-t6nsdAhCxZjbEJzfuhD5-u7gsTLLI9CeB75qRL_t4q4bBq5HEoyoLeLMjONH7SscqM9NWbXWLl_Hm6QN9GDpRrJh9lUG1yQclB8-4SySzjc",
  },
];

export const featuredArticle = articles.find((a) => a.featured) ?? articles[0];

export const getArticleBySlug = (slug: string): Article | undefined =>
  articles.find((a) => a.slug === slug);
