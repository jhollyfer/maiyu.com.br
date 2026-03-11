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
    "nav.services": "Services",
    "nav.projects": "Projects",
    "nav.team": "Team",
    "nav.contact": "Contact",
    "nav.getInTouch": "Get in Touch",

    // Hero
    "hero.title": "Software from the Amazon.\nBuilt for the world.",
    "hero.description":
      "We design and develop custom software that helps businesses modernize their operations. Based in Benjamin Constant, Amazonas.",
    "hero.seeWork": "See Our Work",
    "hero.talkToUs": "Talk to Us",

    // Services
    "services.label": "Services",
    "services.heading": "What we build",
    "services.web.title": "Web Development",
    "services.web.description":
      "Modern, responsive web applications built with React, TypeScript and the latest frameworks.",
    "services.mobile.title": "Mobile Development",
    "services.mobile.description":
      "Native and cross-platform mobile apps for iOS and Android.",
    "services.backend.title": "Backend & APIs",
    "services.backend.description":
      "Scalable server-side solutions with Node.js, Fastify and AdonisJS.",
    "services.database.title": "Database Architecture",
    "services.database.description":
      "PostgreSQL and Prisma-based data layers designed for performance and reliability.",
    "services.design.title": "UI/UX Design",
    "services.design.description":
      "User-centered interfaces that are intuitive, accessible and visually compelling.",
    "services.sustainable.title": "Regional Impact",
    "services.sustainable.description":
      "Technology solutions adapted to the unique needs of the Amazon region.",

    // Projects
    "projects.label": "Portfolio",
    "projects.heading": "Our Work",
    "projects.visit": "Visit Site",
    "projects.adacaibs.title": "ADACAIBS",
    "projects.adacaibs.description":
      "Institutional platform for the Association of Artisans of Benjamin Constant, connecting traditional craftsmanship with a digital presence.",
    "projects.matis.title": "MatisCraft",
    "projects.matis.description":
      "Collaborative platform for managing indigenous craft production, from raw materials to finished products.",
    "projects.manganga.title": "Manganga",
    "projects.manganga.description":
      "Digital system for managing and showcasing regional cultural events and community initiatives.",

    // Team
    "team.heading": "The Team",
    "team.jhollyfer.name": "Jhollyfer Rodrigues",
    "team.jhollyfer.role": "CTO & Founder",
    "team.lenny.name": "Lenny Alberto",
    "team.lenny.role": "CEO & UI/UX Designer",
    "team.geison.name": "Geison Brando",
    "team.geison.role": "Tech Leader",
    "team.matheus.name": "Matheus Silva",
    "team.matheus.role": "System Analyst",

    // Contact
    "contact.label": "Contact",
    "contact.heading": "Let's talk",
    "contact.name": "Your Name",
    "contact.email": "Your Email",
    "contact.company": "Company (Optional)",
    "contact.message": "Your Message",
    "contact.send": "Send Message",
    "contact.address": "Our Address",
    "contact.phone": "Phone",
    "contact.emailUs": "Email",
    "contact.required": "This field is required",
    "contact.invalidEmail": "Enter a valid email",
    "contact.success": "Message sent! We'll get back to you soon.",

    // Footer
    "footer.tagline":
      "Building digital solutions from the Amazon to the world.",
    "footer.services": "Services",
    "footer.web": "Web Development",
    "footer.mobile": "Mobile Apps",
    "footer.software": "Custom Software",
    "footer.design": "UI/UX Design",
    "footer.sustainable": "Regional Solutions",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.cookies": "Cookies",
    "footer.backToTop": "Back to top",
  },
  "pt-BR": {
    // Nav
    "nav.home": "Inicio",
    "nav.services": "Servicos",
    "nav.projects": "Projetos",
    "nav.team": "Equipe",
    "nav.contact": "Contato",
    "nav.getInTouch": "Fale Conosco",

    // Hero
    "hero.title": "Software da Amazonia.\nFeito para o mundo.",
    "hero.description":
      "Projetamos e desenvolvemos software sob medida que ajuda empresas a modernizar suas operacoes. Sediados em Benjamin Constant, Amazonas.",
    "hero.seeWork": "Ver Nosso Trabalho",
    "hero.talkToUs": "Fale Conosco",

    // Services
    "services.label": "Servicos",
    "services.heading": "O que construimos",
    "services.web.title": "Desenvolvimento Web",
    "services.web.description":
      "Aplicacoes web modernas e responsivas com React, TypeScript e os frameworks mais recentes.",
    "services.mobile.title": "Desenvolvimento Mobile",
    "services.mobile.description":
      "Apps nativos e multiplataforma para iOS e Android.",
    "services.backend.title": "Backend e APIs",
    "services.backend.description":
      "Solucoes server-side escalaveis com Node.js, Fastify e AdonisJS.",
    "services.database.title": "Arquitetura de Dados",
    "services.database.description":
      "Camadas de dados com PostgreSQL e Prisma projetadas para performance e confiabilidade.",
    "services.design.title": "Design UI/UX",
    "services.design.description":
      "Interfaces centradas no usuario que sao intuitivas, acessiveis e visualmente atraentes.",
    "services.sustainable.title": "Impacto Regional",
    "services.sustainable.description":
      "Solucoes tecnologicas adaptadas as necessidades unicas da regiao amazonica.",

    // Projects
    "projects.label": "Portfolio",
    "projects.heading": "Nosso Trabalho",
    "projects.visit": "Visitar Site",
    "projects.adacaibs.title": "ADACAIBS",
    "projects.adacaibs.description":
      "Plataforma institucional da Associacao de Artesaos de Benjamin Constant, conectando o artesanato tradicional com presenca digital.",
    "projects.matis.title": "MatisCraft",
    "projects.matis.description":
      "Plataforma colaborativa para gestao da producao artesanal indigena, da materia-prima ao produto final.",
    "projects.manganga.title": "Manganga",
    "projects.manganga.description":
      "Sistema digital para gestao e divulgacao de eventos culturais regionais e iniciativas comunitarias.",

    // Team
    "team.heading": "A Equipe",
    "team.jhollyfer.name": "Jhollyfer Rodrigues",
    "team.jhollyfer.role": "CTO e Fundador",
    "team.lenny.name": "Lenny Alberto",
    "team.lenny.role": "CEO e Designer UI/UX",
    "team.geison.name": "Geison Brando",
    "team.geison.role": "Lider Tecnico",
    "team.matheus.name": "Matheus Silva",
    "team.matheus.role": "Analista de Sistemas",

    // Contact
    "contact.label": "Contato",
    "contact.heading": "Vamos conversar",
    "contact.name": "Seu Nome",
    "contact.email": "Seu Email",
    "contact.company": "Empresa (Opcional)",
    "contact.message": "Sua Mensagem",
    "contact.send": "Enviar Mensagem",
    "contact.address": "Nosso Endereco",
    "contact.phone": "Telefone",
    "contact.emailUs": "Email",
    "contact.required": "Este campo e obrigatorio",
    "contact.invalidEmail": "Digite um email valido",
    "contact.success": "Mensagem enviada! Retornaremos em breve.",

    // Footer
    "footer.tagline":
      "Construindo solucoes digitais da Amazonia para o mundo.",
    "footer.services": "Servicos",
    "footer.web": "Desenvolvimento Web",
    "footer.mobile": "Aplicativos Mobile",
    "footer.software": "Software Personalizado",
    "footer.design": "Design UI/UX",
    "footer.sustainable": "Solucoes Regionais",
    "footer.contact": "Contato",
    "footer.rights": "Todos os direitos reservados",
    "footer.terms": "Termos de Servico",
    "footer.privacy": "Politica de Privacidade",
    "footer.cookies": "Cookies",
    "footer.backToTop": "Voltar ao topo",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
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
