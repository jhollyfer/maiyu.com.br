import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "pt-BR";

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Translations = {
  en: {
    // Nav
    "nav.home": "Home",
    "nav.portfolio": "Portfolio",
    "nav.blog": "Blog",
    "nav.career": "Career",
    "nav.contact": "Contact",
    "nav.getInTouch": "Get in Touch",

    // Home
    "home.badge": "Software from the Amazon",
    "home.heroTitle1": "Software",
    "home.heroTitle2": "from the Amazon.",
    "home.heroDescription": "We build high-performance digital solutions with modern technologies. From the heart of the Amazon to the world, Maiyu delivers robust and scalable software.",
    "home.startProject": "Start a Project",
    "home.viewWork": "View Work",
    "home.statsProducts": "Products",
    "home.statsEngineers": "Engineers",
    "home.statsRegion": "Region",
    "home.servicesLabel": "What we do",
    "home.servicesHeading": "End-to-End Software Solutions.",
    "home.servicesSubheading": "From concept to deployment, we cover every layer of your digital product with precision and quality.",
    "home.serviceWeb": "Web Development",
    "home.serviceWebDesc": "Responsive and performant web applications built with React, Next.js, and modern frontend frameworks.",
    "home.serviceMobile": "Mobile Apps",
    "home.serviceMobileDesc": "Cross-platform mobile applications with React Native, delivering native performance on iOS and Android.",
    "home.serviceBackend": "Backend & APIs",
    "home.serviceBackendDesc": "Robust server-side solutions with AdonisJS, Fastify, and Node.js. RESTful APIs and real-time services.",
    "home.serviceDatabase": "Database Design",
    "home.serviceDatabaseDesc": "Optimized database architecture with PostgreSQL and Prisma ORM for reliable, scalable data persistence.",
    "home.serviceDesign": "UI/UX Design",
    "home.serviceDesignDesc": "User-centered interfaces designed with attention to detail, accessibility, and visual consistency.",
    "home.serviceImpact": "Regional Impact",
    "home.serviceImpactDesc": "Technology solutions that empower communities in the Amazon region, bridging the digital divide with innovation.",
    "home.learnMore": "Learn More",
    "home.selectedWork": "Selected Work",
    "home.ctaTitle": "Ready to build something amazing?",
    "home.ctaDescription": "Let's turn your idea into a high-quality digital product. Get in touch and let's start building.",
    "home.ctaButton1": "Let's Talk Project",
    "home.ctaButton2": "View Portfolio",

    // Blog
    "blog.featured": "Featured Article",
    "blog.category.all": "All Posts",
    "blog.category.tech": "Tech",
    "blog.category.design": "Design",
    "blog.category.marketing": "Marketing",
    "blog.readStory": "Read Story",
    "blog.recentArticles": "Recent Articles",
    "blog.newsletterTitle": "Stay ahead of the curve",
    "blog.newsletterDesc": "Join designers and developers getting our weekly insights on tech and design innovation.",
    "blog.emailPlaceholder": "Your email address",
    "blog.subscribe": "Subscribe",

    // Blog Article
    "blogArticle.introText": "The landscape of mobile development is shifting faster than ever. As we move further into 2024, the focus has moved beyond mere functionality to creating seamless, scalable, and highly performant user experiences.",
    "blogArticle.section1Title": "Embracing Micro-Frontends for Mobile",
    "blogArticle.section1Text": "Traditional monolithic apps are becoming harder to maintain. Micro-frontends allow teams to work independently on different features of the app without interfering with each other's codebases.",
    "blogArticle.bullet1": "Faster iteration cycles across distributed teams.",
    "blogArticle.bullet2": "Isolation of bugs and performance issues.",
    "blogArticle.bullet3": "Ability to use different technology stacks for specialized features.",
    "blogArticle.section2Title": "Performance Optimization in the 5G Era",
    "blogArticle.section2Text": "Despite faster networks, user expectations for speed have skyrocketed. A delay of just 100ms can lead to significant drops in engagement.",
    "blogArticle.quote": "\"Scalability isn't just about handling more users; it's about maintaining consistent performance as complexity grows.\"",
    "blogArticle.section3Title": "The Rise of AI-Driven UX",
    "blogArticle.section3Text": "Integrating machine learning directly into the mobile client allows for personalized experiences without the latency of cloud round-trips.",
    "blogArticle.ctaTitle": "Ready to build your app?",
    "blogArticle.ctaDescription": "Let's build the future together with Maiyu's engineering expertise.",
    "blogArticle.ctaButton1": "Start Building",
    "blogArticle.ctaButton2": "Schedule Demo",

    // Career
    "career.badge": "Open Recruitment",
    "career.heroTitle": "Join our team!",
    "career.heroDescription": "Work at Maiyu and help build the future of technology with a passionate and innovative team. We are looking for talented people who want to make an impact.",
    "career.teamCount": "Join our growing team",
    "career.formTitle": "Quick Application",
    "career.nameLabel": "Full Name",
    "career.namePlaceholder": "Your name",
    "career.emailLabel": "Professional Email",
    "career.positionLabel": "Position of Interest",
    "career.positionPlaceholder": "Select a position",
    "career.linkedinLabel": "LinkedIn or Portfolio",
    "career.submitButton": "Submit Application",
    "career.privacyNote": "By submitting, you agree to our privacy terms.",
    "career.successMessage": "Application sent! We'll review it shortly.",
    "career.benefitsTitle": "Why work at Maiyu?",
    "career.benefitsDescription": "We offer a dynamic environment focused on well-being and constant growth. Our culture is based on trust and autonomy.",
    "career.benefit1Title": "100% Remote",
    "career.benefit1Desc": "Geographic freedom to work from anywhere, with monthly home-office allowance for your setup.",
    "career.benefit2Title": "Flexible Hours",
    "career.benefit2Desc": "We focus on deliverables, not hours. Organize your day for better quality of life.",
    "career.benefit3Title": "Premium Health",
    "career.benefit3Desc": "Top health and dental plan for you and dependents, no co-pay.",
    "career.benefit4Title": "Continuous Education",
    "career.benefit4Desc": "Annual budget for courses, events, and books. We want you to grow with us.",
    "career.jobsTitle": "Featured Positions",
    "career.jobsDescription": "Find the perfect opportunity for your career stage.",
    "career.viewDetails": "View Details",

    // Contact
    "contactPage.subtitle": "Reach Out",
    "contactPage.title": "Get in Touch",
    "contactPage.description": "Have questions? Our team is here to help you build something amazing. Fill out the form and we'll be in touch within 24 hours.",
    "contactPage.firstName": "First Name",
    "contactPage.lastName": "Last Name",
    "contactPage.emailLabel": "Email Address",
    "contactPage.messageLabel": "Your Message",
    "contactPage.messagePlaceholder": "How can we help you?",
    "contactPage.sendButton": "Send Message",
    "contactPage.successMessage": "Message sent! We'll get back to you soon.",
    "contactPage.happyClients": "Our team is ready to help",
    "contactPage.testimonial": "We build software from the Amazon to the world. Let's create something incredible together.",
    "contactPage.emailTitle": "Email Us",
    "contactPage.emailSubtitle": "General & Support",
    "contactPage.phoneTitle": "Call Us",
    "contactPage.phoneSubtitle": "Mon-Fri from 9am to 6pm",
    "contactPage.locationTitle": "Visit Us",
    "contactPage.locationSubtitle": "Our creative studio space",

    // Portfolio
    "portfolio.badge": "Our Projects",
    "portfolio.heroTitle1": "Building",
    "portfolio.heroTitle2": "real solutions",
    "portfolio.heroTitle3": "from the Amazon.",
    "portfolio.heroDescription": "We partner with organizations to design and build meaningful digital products that solve real problems and create lasting impact.",
    "portfolio.loadMore": "See All Projects",

    // Footer
    "footer.tagline": "Building digital solutions from the Amazon to the world.",
    "footer.navigation": "Navigation",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.backToTop": "Back to top",
  },
  "pt-BR": {
    // Nav
    "nav.home": "Inicio",
    "nav.portfolio": "Portfolio",
    "nav.blog": "Blog",
    "nav.career": "Carreiras",
    "nav.contact": "Contato",
    "nav.getInTouch": "Fale Conosco",

    // Home
    "home.badge": "Software da Amazonia",
    "home.heroTitle1": "Software",
    "home.heroTitle2": "da Amazonia.",
    "home.heroDescription": "Construimos solucoes digitais de alta performance com tecnologias modernas. Do coracao da Amazonia para o mundo, a Maiyu entrega software robusto e escalavel.",
    "home.startProject": "Iniciar Projeto",
    "home.viewWork": "Ver Trabalhos",
    "home.statsProducts": "Produtos",
    "home.statsEngineers": "Engenheiros",
    "home.statsRegion": "Regiao",
    "home.servicesLabel": "O que fazemos",
    "home.servicesHeading": "Solucoes de Software Completas.",
    "home.servicesSubheading": "Do conceito ao deploy, cobrimos cada camada do seu produto digital com precisao e qualidade.",
    "home.serviceWeb": "Desenvolvimento Web",
    "home.serviceWebDesc": "Aplicacoes web responsivas e performaticas construidas com React, Next.js e frameworks frontend modernos.",
    "home.serviceMobile": "Apps Mobile",
    "home.serviceMobileDesc": "Aplicativos mobile multiplataforma com React Native, entregando performance nativa no iOS e Android.",
    "home.serviceBackend": "Backend & APIs",
    "home.serviceBackendDesc": "Solucoes server-side robustas com AdonisJS, Fastify e Node.js. APIs RESTful e servicos em tempo real.",
    "home.serviceDatabase": "Design de Banco de Dados",
    "home.serviceDatabaseDesc": "Arquitetura de banco de dados otimizada com PostgreSQL e Prisma ORM para persistencia confiavel e escalavel.",
    "home.serviceDesign": "Design UI/UX",
    "home.serviceDesignDesc": "Interfaces centradas no usuario, projetadas com atencao aos detalhes, acessibilidade e consistencia visual.",
    "home.serviceImpact": "Impacto Regional",
    "home.serviceImpactDesc": "Solucoes tecnologicas que empoderam comunidades na regiao amazonica, conectando inovacao e inclusao digital.",
    "home.learnMore": "Saiba Mais",
    "home.selectedWork": "Trabalhos Selecionados",
    "home.ctaTitle": "Pronto para construir algo incrivel?",
    "home.ctaDescription": "Vamos transformar sua ideia em um produto digital de alta qualidade. Entre em contato e vamos comecar a construir.",
    "home.ctaButton1": "Vamos Conversar",
    "home.ctaButton2": "Ver Portfolio",

    // Blog
    "blog.featured": "Artigo em Destaque",
    "blog.category.all": "Todos os Posts",
    "blog.category.tech": "Tecnologia",
    "blog.category.design": "Design",
    "blog.category.marketing": "Marketing",
    "blog.readStory": "Ler Historia",
    "blog.recentArticles": "Artigos Recentes",
    "blog.newsletterTitle": "Fique a frente da curva",
    "blog.newsletterDesc": "Junte-se a designers e desenvolvedores recebendo nossos insights semanais sobre tecnologia e inovacao em design.",
    "blog.emailPlaceholder": "Seu endereco de email",
    "blog.subscribe": "Inscrever-se",

    // Blog Article
    "blogArticle.introText": "O cenario do desenvolvimento mobile esta mudando mais rapido do que nunca. Conforme avancamos em 2024, o foco passou da mera funcionalidade para a criacao de experiencias de usuario impecaveis, escalaveis e de alta performance.",
    "blogArticle.section1Title": "Adotando Micro-Frontends para Mobile",
    "blogArticle.section1Text": "Apps monoliticos tradicionais estao se tornando cada vez mais dificeis de manter. Micro-frontends permitem que equipes trabalhem independentemente em diferentes funcionalidades.",
    "blogArticle.bullet1": "Ciclos de iteracao mais rapidos em equipes distribuidas.",
    "blogArticle.bullet2": "Isolamento de bugs e problemas de performance.",
    "blogArticle.bullet3": "Capacidade de usar diferentes stacks tecnologicos para funcionalidades especializadas.",
    "blogArticle.section2Title": "Otimizacao de Performance na Era 5G",
    "blogArticle.section2Text": "Apesar de redes mais rapidas, as expectativas dos usuarios por velocidade dispararam. Um atraso de apenas 100ms pode levar a quedas significativas no engajamento.",
    "blogArticle.quote": "\"Escalabilidade nao e apenas sobre lidar com mais usuarios; e sobre manter performance consistente conforme a complexidade cresce.\"",
    "blogArticle.section3Title": "A Ascensao da UX Orientada por IA",
    "blogArticle.section3Text": "Integrar machine learning diretamente no cliente mobile permite experiencias personalizadas sem a latencia de ida e volta ao cloud.",
    "blogArticle.ctaTitle": "Pronto para construir seu app?",
    "blogArticle.ctaDescription": "Vamos construir o futuro juntos com a expertise de engenharia da Maiyu.",
    "blogArticle.ctaButton1": "Comecar a Construir",
    "blogArticle.ctaButton2": "Agendar Demo",

    // Career
    "career.badge": "Recrutamento Aberto",
    "career.heroTitle": "Faca parte do nosso time!",
    "career.heroDescription": "Trabalhe na Maiyu e ajude a construir o futuro da tecnologia com um time apaixonado e inovador. Estamos em busca de talentos que queiram impactar o mundo.",
    "career.teamCount": "Junte-se ao nosso time em crescimento",
    "career.formTitle": "Candidatura Rapida",
    "career.nameLabel": "Nome Completo",
    "career.namePlaceholder": "Seu nome",
    "career.emailLabel": "E-mail Profissional",
    "career.positionLabel": "Vaga de Interesse",
    "career.positionPlaceholder": "Selecione uma vaga",
    "career.linkedinLabel": "LinkedIn ou Portfolio",
    "career.submitButton": "Enviar Candidatura",
    "career.privacyNote": "Ao enviar, voce concorda com nossos termos de privacidade.",
    "career.successMessage": "Candidatura enviada! Avaliaremos em breve.",
    "career.benefitsTitle": "Por que trabalhar na Maiyu?",
    "career.benefitsDescription": "Oferecemos um ambiente dinamico com foco no bem-estar e crescimento constante. Nossa cultura e baseada na confianca e autonomia.",
    "career.benefit1Title": "100% Remoto",
    "career.benefit1Desc": "Liberdade geografica para trabalhar de onde quiser, com auxilio home-office mensal para seu setup.",
    "career.benefit2Title": "Horario Flexivel",
    "career.benefit2Desc": "Focamos em entregas, nao em horas sentadas. Organize seu dia para ter mais qualidade de vida.",
    "career.benefit3Title": "Saude Premium",
    "career.benefit3Desc": "Plano de saude e odontologico top para voce e dependentes, sem coparticipacao.",
    "career.benefit4Title": "Educacao Continua",
    "career.benefit4Desc": "Orcamento anual para cursos, eventos e livros. Queremos que voce evolua junto conosco.",
    "career.jobsTitle": "Vagas em Destaque",
    "career.jobsDescription": "Encontre a oportunidade ideal para o seu momento de carreira.",
    "career.viewDetails": "Ver Detalhes",

    // Contact
    "contactPage.subtitle": "Entre em Contato",
    "contactPage.title": "Fale Conosco",
    "contactPage.description": "Tem perguntas? Nossa equipe esta aqui para ajuda-lo a construir algo incrivel. Preencha o formulario e entraremos em contato em ate 24 horas.",
    "contactPage.firstName": "Nome",
    "contactPage.lastName": "Sobrenome",
    "contactPage.emailLabel": "Endereco de Email",
    "contactPage.messageLabel": "Sua Mensagem",
    "contactPage.messagePlaceholder": "Como podemos ajudar?",
    "contactPage.sendButton": "Enviar Mensagem",
    "contactPage.successMessage": "Mensagem enviada! Retornaremos em breve.",
    "contactPage.happyClients": "Nossa equipe esta pronta para ajudar",
    "contactPage.testimonial": "Construimos software da Amazonia para o mundo. Vamos criar algo incrivel juntos.",
    "contactPage.emailTitle": "Email",
    "contactPage.emailSubtitle": "Geral e Suporte",
    "contactPage.phoneTitle": "Telefone",
    "contactPage.phoneSubtitle": "Seg-Sex das 9h as 18h",
    "contactPage.locationTitle": "Endereco",
    "contactPage.locationSubtitle": "Nosso espaco criativo",

    // Portfolio
    "portfolio.badge": "Nossos Projetos",
    "portfolio.heroTitle1": "Construindo",
    "portfolio.heroTitle2": "solucoes reais",
    "portfolio.heroTitle3": "da Amazonia.",
    "portfolio.heroDescription": "Nos associamos a organizacoes para projetar e construir produtos digitais significativos que resolvem problemas reais e criam impacto duradouro.",
    "portfolio.loadMore": "Ver Todos os Projetos",

    // Footer
    "footer.tagline": "Construindo solucoes digitais da Amazonia para o mundo.",
    "footer.navigation": "Navegacao",
    "footer.contact": "Contato",
    "footer.rights": "Todos os direitos reservados",
    "footer.terms": "Termos de Servico",
    "footer.privacy": "Politica de Privacidade",
    "footer.backToTop": "Voltar ao topo",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("pt-BR");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (
      savedLanguage &&
      (savedLanguage === "en" || savedLanguage === "pt-BR")
    ) {
      setLanguageState(savedLanguage);
    } else {
      const browserLang = navigator.language;
      if (browserLang.startsWith("pt")) {
        setLanguageState("pt-BR");
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    if (translations[language]?.[key]) {
      return translations[language][key];
    }
    if (translations["en"]?.[key]) {
      return translations["en"][key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
