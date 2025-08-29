import React, { createContext, useContext, useEffect, useState } from "react";

// Define available languages
type Language = "en" | "pt-BR";

// Define translation object type
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Define context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Translations
const translations: Translations = {
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.projects": "Projects",
    "nav.team": "Team",
    "nav.contact": "Contact",
    "nav.getInTouch": "Get in Touch",
    "nav.toggleTheme": "Toggle Theme",

    "hero.tagline": "Innovative Software Solutions for Emerging Amazon Regions",
    "hero.title": "Turning Ideas into",
    "hero.titleGradient": "Digital Reality",
    "hero.description":
      "We are the first technology company focused on the Amazon region, building custom software solutions that help businesses transform their operations and deliver exceptional experiences to their customers.",
    "hero.startProject": "Start a Project",
    "hero.ourServices": "Our Services",
    "hero.trustedBy": "TRUSTED BY INNOVATIVE COMPANIES",
    "hero.scrollDown": "Scroll Down",
    "hero.amazon": "Technology Pioneers in the ARS region",

    "services.title": "Our Services",
    "services.heading": "What We",
    "services.headingGradient": "Do Best",
    "services.description":
      "We offer a wide range of software development services to help your business grow and succeed in the digital landscape, with special focus on solutions for the Amazon region.",

    "services.web.title": "Web Development",
    "services.web.description":
      "Modern, responsive websites and web applications using the latest technologies.",
    "services.mobile.title": "Mobile Development",
    "services.mobile.description":
      "Native and cross-platform mobile applications for iOS and Android.",
    "services.backend.title": "Backend Development",
    "services.backend.description":
      "Robust and scalable server-side solutions to power your applications.",
    "services.database.title": "Database Design",
    "services.database.description":
      "Efficient database architecture and optimization for your data needs.",
    "services.design.title": "UI/UX Design",
    "services.design.description":
      "User-centered design that creates intuitive and engaging experiences.",
    "services.sustainable.title": "Sustainable Solutions",
    "services.sustainable.description":
      "Eco-friendly technologies optimized for the Amazon region's unique challenges.",

    "projects.title": "Our Work",
    "projects.heading": "Recent",
    "projects.headingGradient": "Projects",
    "projects.description":
      "Take a look at some of our recent projects that showcase our expertise and capabilities in the Amazon region.",
    "projects.startYourProject": "Start Your Project",

    "projects.fintech.title": "Fintech Dashboard",
    "projects.fintech.description":
      "A comprehensive financial management platform with analytics and reporting tools.",
    "projects.ecommerce.title": "E-commerce Platform",
    "projects.ecommerce.description":
      "A fully-featured online store with payment processing and inventory management.",
    "projects.healthcare.title": "Healthcare App",
    "projects.healthcare.description":
      "A telemedicine application connecting patients with healthcare providers remotely.",
    "projects.amazon.title": "Amazon Monitoring System",
    "projects.amazon.description":
      "A satellite-based monitoring system for tracking deforestation and conservation efforts.",

    "team.title": "Our Team",
    "team.heading": "Meet The",
    "team.headingGradient": "Experts",
    "team.description":
      "Our talented team of professionals is dedicated to delivering outstanding results for our clients throughout the Amazon region.",

    "team.jhollyfer.name": "Jhollyfer Rodrigues",
    "team.jhollyfer.role": "CTO & Founder",
    "team.lenny.name": "Lenny Alberto",
    "team.lenny.role": "CEO & UI/UX Designer",
    "team.anderson.name": "Anderson Ferreira",
    "team.anderson.role": "Systems Analyst",
    "team.geison.name": "Geison Brando",
    "team.geison.role": "Tech Leader",
    "team.matheus.name": "Matheus Silva",
    "team.matheus.role": "Software Engineer",

    "contact.title": "Get in Touch",
    "contact.subtitle": "Start a Conversation",
    "contact.name": "Your Name",
    "contact.email": "Your Email",
    "contact.message": "Your Message",
    "contact.send": "Send Message",
    "contact.address": "Our Address",
    "contact.phone": "Phone Number",
    "contact.emailUs": "Email Us",
    "contact.company": "Company (Optional)",

    "footer.tagline":
      "Building innovative digital solutions for the Amazon region and beyond.",
    "footer.services": "Services",
    "footer.web": "Web Development",
    "footer.mobile": "Mobile Apps",
    "footer.software": "Custom Software",
    "footer.design": "UI/UX Design",
    "footer.sustainable": "Sustainable Tech",

    "footer.company": "Company",
    "footer.about": "About Us",
    "footer.careers": "Careers",
    "footer.blog": "Blog",
    "footer.privacy": "Privacy Policy",

    "footer.contact": "Contact",
    "footer.rights": "All rights reserved",
    "footer.terms": "Terms of Service",
    "footer.cookies": "Cookie Policy",
    "footer.amazon": "The Amazon at the next level",
  },
  "pt-BR": {
    "nav.home": "Início",
    "nav.services": "Serviços",
    "nav.projects": "Projetos",
    "nav.team": "Equipe",
    "nav.contact": "Contato",
    "nav.getInTouch": "Fale Conosco",
    "nav.toggleTheme": "Alternar Tema",

    "hero.tagline":
      "Soluções de Software Inovadoras para a Regiões Emergentes da Amazônia",
    "hero.title": "Transformando Ideias em",
    "hero.titleGradient": "Realidade Digital",
    "hero.description":
      "Somos a primeira empresa de tecnologia focada na região amazônica, desenvolvendo soluções de software personalizadas que ajudam empresas a transformar suas operações e entregar experiências excepcionais aos seus clientes.",
    "hero.startProject": "Iniciar Projeto",
    "hero.ourServices": "Nossos Serviços",
    "hero.trustedBy": "CONFIADO POR EMPRESAS INOVADORAS",
    "hero.scrollDown": "Rolar para Baixo",
    "hero.amazon": "Pioneiros em Tecnologia na região do ARS",

    "services.title": "Nossos Serviços",
    "services.heading": "O Que Fazemos",
    "services.headingGradient": "de Melhor",
    "services.description":
      "Oferecemos uma ampla gama de serviços de desenvolvimento de software para ajudar seu negócio a crescer e ter sucesso no cenário digital, com foco especial em soluções para a região amazônica.",

    "services.web.title": "Desenvolvimento Web",
    "services.web.description":
      "Sites e aplicações web modernas e responsivas utilizando as tecnologias mais recentes.",
    "services.mobile.title": "Desenvolvimento Mobile",
    "services.mobile.description":
      "Aplicativos nativos e multiplataforma para iOS e Android.",
    "services.backend.title": "Desenvolvimento Backend",
    "services.backend.description":
      "Soluções robustas e escaláveis do lado do servidor para alimentar suas aplicações.",
    "services.database.title": "Design de Banco de Dados",
    "services.database.description":
      "Arquitetura e otimização eficiente de banco de dados para suas necessidades.",
    "services.design.title": "Design UI/UX",
    "services.design.description":
      "Design centrado no usuário que cria experiências intuitivas e envolventes.",
    "services.sustainable.title": "Soluções Sustentáveis",
    "services.sustainable.description":
      "Tecnologias ecológicas otimizadas para os desafios únicos da região amazônica.",

    "projects.title": "Nosso Trabalho",
    "projects.heading": "Projetos",
    "projects.headingGradient": "Recentes",
    "projects.description":
      "Veja alguns de nossos projetos recentes que demonstram nossa experiência e capacidades na região amazônica.",
    "projects.startYourProject": "Inicie Seu Projeto",

    "projects.fintech.title": "Dashboard Fintech",
    "projects.fintech.description":
      "Uma plataforma abrangente de gestão financeira com ferramentas de análise e relatórios.",
    "projects.ecommerce.title": "Plataforma E-commerce",
    "projects.ecommerce.description":
      "Uma loja online completa com processamento de pagamentos e gerenciamento de inventário.",
    "projects.healthcare.title": "App de Saúde",
    "projects.healthcare.description":
      "Um aplicativo de telemedicina conectando pacientes com profissionais de saúde remotamente.",
    "projects.amazon.title": "Sistema de Monitoramento Amazônico",
    "projects.amazon.description":
      "Um sistema de monitoramento baseado em satélite para rastrear esforços de desmatamento e conservação.",

    "team.title": "Nossa Equipe",
    "team.heading": "Conheça os",
    "team.headingGradient": "Especialistas",
    "team.description":
      "Nossa talentosa equipe de profissionais é dedicada a entregar resultados excepcionais para nossos clientes em toda a região amazônica.",

    "team.jhollyfer.name": "Jhollyfer Rodrigues",
    "team.jhollyfer.role": "CTO e Fundador",
    "team.lenny.name": "Lenny Alberto",
    "team.lenny.role": "CEO e Designer UI/UX",
    "team.anderson.name": "Anderson Ferreira",
    "team.anderson.role": "Analista de Sistemas",
    "team.geison.name": "Geison Brando",
    "team.geison.role": "Líder Técnico",
    "team.matheus.name": "Matheus Silva",
    "team.matheus.role": "Analista de Sistemas",

    "contact.title": "Fale Conosco",
    "contact.subtitle": "Inicie uma Conversa",
    "contact.name": "Seu Nome",
    "contact.email": "Seu Email",
    "contact.message": "Sua Mensagem",
    "contact.send": "Enviar Mensagem",
    "contact.address": "Nosso Endereço",
    "contact.phone": "Telefone",
    "contact.emailUs": "Email",
    "contact.company": "Empresa (Opcional)",

    "footer.tagline":
      "Construindo soluções digitais inovadoras para a região amazônica e além.",
    "footer.services": "Serviços",
    "footer.web": "Desenvolvimento Web",
    "footer.mobile": "Aplicativos Mobile",
    "footer.software": "Software Personalizado",
    "footer.design": "Design UI/UX",
    "footer.sustainable": "Tecnologia Sustentável",

    "footer.company": "Empresa",
    "footer.about": "Sobre Nós",
    "footer.careers": "Carreiras",
    "footer.blog": "Blog",
    "footer.privacy": "Política de Privacidade",

    "footer.contact": "Contato",
    "footer.rights": "Todos os direitos reservados",
    "footer.terms": "Termos de Serviço",
    "footer.cookies": "Política de Cookies",
    "footer.amazon": "A amazônia no proximo nível",
  },
};

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("pt-BR");

  useEffect(() => {
    // Get language from localStorage or use browser language (defaulting to 'en')
    const savedLanguage = localStorage.getItem("language") as Language;

    if (
      savedLanguage &&
      (savedLanguage === "en" || savedLanguage === "pt-BR")
    ) {
      setLanguageState(savedLanguage);
    } else {
      // Check browser language preference
      const browserLang = navigator.language;
      if (browserLang.startsWith("pt")) {
        setLanguageState("pt-BR");
      }
    }
  }, []);

  // Update language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  // Translation function
  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }

    // Fallback to English
    if (translations["en"] && translations["en"][key]) {
      return translations["en"][key];
    }

    // Return the key if no translation found
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook for using the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
