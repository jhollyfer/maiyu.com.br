
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Language types
export type Language = 'pt-BR' | 'en';

// Context type
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

// Translation data
export const translations = {
  'en': {
    // Navbar
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.projects': 'Projects',
    'nav.team': 'Team',
    'nav.contact': 'Contact',
    'nav.getInTouch': 'Get in Touch',
    
    // Hero
    'hero.tagline': 'Innovative Software Solutions',
    'hero.title': 'Transforming Ideas Into',
    'hero.titleGradient': 'Digital Experiences',
    'hero.description': 'We create custom software solutions that enhance your business operations, improve customer experiences, and drive growth in the digital landscape.',
    'hero.startProject': 'Start Your Project',
    'hero.ourServices': 'Our Services',
    'hero.trustedBy': 'Trusted by innovative companies',
    'hero.scrollDown': 'Scroll Down',
    
    // Services
    'services.title': 'Our Expertise',
    'services.heading': 'Innovative Solutions for',
    'services.headingGradient': 'Modern Challenges',
    'services.description': 'We offer a comprehensive range of software development services tailored to meet your specific business needs and objectives.',
    
    'services.web.title': 'Web Development',
    'services.web.description': 'We build responsive, high-performance web applications using cutting-edge technologies that deliver exceptional user experiences.',
    
    'services.mobile.title': 'Mobile Applications',
    'services.mobile.description': 'Native and cross-platform mobile apps that provide seamless experiences across iOS and Android devices.',
    
    'services.backend.title': 'Backend Development',
    'services.backend.description': 'Robust server-side solutions that power your applications with reliability, security, and scalability.',
    
    'services.database.title': 'Database Solutions',
    'services.database.description': 'Optimized database architecture and management for efficient data storage, retrieval, and analysis.',
    
    'services.design.title': 'UI/UX Design',
    'services.design.description': 'Beautiful, intuitive interfaces designed with your users in mind, ensuring engagement and satisfaction.',
    
    // Projects
    'projects.title': 'Our Portfolio',
    'projects.heading': 'Showcasing Our',
    'projects.headingGradient': 'Recent Work',
    'projects.description': 'Explore our diverse portfolio of successful projects that demonstrate our expertise and commitment to excellence.',
    'projects.startYourProject': 'Start Your Project',
    
    'projects.fintech.title': 'FinTech Dashboard',
    'projects.fintech.description': 'A comprehensive financial analytics platform with real-time data visualization and predictive analytics.',
    
    'projects.ecommerce.title': 'E-commerce Platform',
    'projects.ecommerce.description': 'A scalable online shopping solution with advanced product filtering, user authentication, and payment processing.',
    
    'projects.healthcare.title': 'Healthcare Mobile App',
    'projects.healthcare.description': 'Patient-centered mobile application for appointment scheduling, medical records access, and telemedicine consultations.',
    
    // Team
    'team.title': 'Our Team',
    'team.heading': 'Meet the',
    'team.headingGradient': 'Innovators',
    'team.description': 'Our team of passionate experts brings together diverse skills and experiences to deliver exceptional results.',
    
    'team.alex.name': 'Alex Morgan',
    'team.alex.role': 'CEO & Founder',
    
    'team.sophia.name': 'Sophia Chen',
    'team.sophia.role': 'CTO',
    
    'team.james.name': 'James Wilson',
    'team.james.role': 'Lead Developer',
    
    'team.olivia.name': 'Olivia Taylor',
    'team.olivia.role': 'UX/UI Designer',
    
    // Footer
    'footer.tagline': 'Transforming ideas into exceptional digital experiences with precision and creativity.',
    'footer.services': 'Services',
    'footer.web': 'Web Development',
    'footer.mobile': 'Mobile Applications',
    'footer.software': 'Custom Software',
    'footer.design': 'UI/UX Design',
    
    'footer.company': 'Company',
    'footer.about': 'About Us',
    'footer.careers': 'Careers',
    'footer.blog': 'Blog',
    'footer.privacy': 'Privacy Policy',
    
    'footer.contact': 'Contact',
    'footer.rights': 'All rights reserved.',
    'footer.terms': 'Terms of Service',
    'footer.cookies': 'Cookies',
  },
  'pt-BR': {
    // Navbar
    'nav.home': 'Início',
    'nav.services': 'Serviços',
    'nav.projects': 'Projetos',
    'nav.team': 'Equipe',
    'nav.contact': 'Contato',
    'nav.getInTouch': 'Fale Conosco',
    
    // Hero
    'hero.tagline': 'Soluções Inovadoras de Software',
    'hero.title': 'Transformando Ideias em',
    'hero.titleGradient': 'Experiências Digitais',
    'hero.description': 'Criamos soluções personalizadas de software que melhoram as operações do seu negócio, aprimoram a experiência do cliente e impulsionam o crescimento no cenário digital.',
    'hero.startProject': 'Iniciar Projeto',
    'hero.ourServices': 'Nossos Serviços',
    'hero.trustedBy': 'Empresas inovadoras confiam em nós',
    'hero.scrollDown': 'Rolar para Baixo',
    
    // Services
    'services.title': 'Nossa Expertise',
    'services.heading': 'Soluções Inovadoras para',
    'services.headingGradient': 'Desafios Modernos',
    'services.description': 'Oferecemos uma ampla gama de serviços de desenvolvimento de software adaptados para atender às suas necessidades e objetivos específicos.',
    
    'services.web.title': 'Desenvolvimento Web',
    'services.web.description': 'Construímos aplicações web responsivas e de alto desempenho utilizando tecnologias de ponta que proporcionam experiências excepcionais aos usuários.',
    
    'services.mobile.title': 'Aplicações Móveis',
    'services.mobile.description': 'Aplicativos nativos e multiplataforma que proporcionam experiências perfeitas em dispositivos iOS e Android.',
    
    'services.backend.title': 'Desenvolvimento Backend',
    'services.backend.description': 'Soluções robustas do lado do servidor que alimentam suas aplicações com confiabilidade, segurança e escalabilidade.',
    
    'services.database.title': 'Soluções de Banco de Dados',
    'services.database.description': 'Arquitetura e gerenciamento otimizados de banco de dados para armazenamento, recuperação e análise eficientes de dados.',
    
    'services.design.title': 'Design UI/UX',
    'services.design.description': 'Interfaces bonitas e intuitivas projetadas com seus usuários em mente, garantindo engajamento e satisfação.',
    
    // Projects
    'projects.title': 'Nosso Portfólio',
    'projects.heading': 'Apresentando Nossos',
    'projects.headingGradient': 'Projetos Recentes',
    'projects.description': 'Explore nosso diversificado portfólio de projetos bem-sucedidos que demonstram nossa expertise e compromisso com a excelência.',
    'projects.startYourProject': 'Inicie Seu Projeto',
    
    'projects.fintech.title': 'Dashboard FinTech',
    'projects.fintech.description': 'Uma plataforma abrangente de análise financeira com visualização de dados em tempo real e análises preditivas.',
    
    'projects.ecommerce.title': 'Plataforma E-commerce',
    'projects.ecommerce.description': 'Uma solução escalável de compras online com filtragem avançada de produtos, autenticação de usuários e processamento de pagamentos.',
    
    'projects.healthcare.title': 'App Móvel de Saúde',
    'projects.healthcare.description': 'Aplicativo móvel centrado no paciente para agendamento de consultas, acesso a registros médicos e consultas de telemedicina.',
    
    // Team
    'team.title': 'Nossa Equipe',
    'team.heading': 'Conheça os',
    'team.headingGradient': 'Inovadores',
    'team.description': 'Nossa equipe de especialistas apaixonados reúne diversas habilidades e experiências para entregar resultados excepcionais.',
    
    'team.alex.name': 'Alex Morgan',
    'team.alex.role': 'CEO & Fundador',
    
    'team.sophia.name': 'Sophia Chen',
    'team.sophia.role': 'CTO',
    
    'team.james.name': 'James Wilson',
    'team.james.role': 'Desenvolvedor Líder',
    
    'team.olivia.name': 'Olivia Taylor',
    'team.olivia.role': 'Designer UX/UI',
    
    // Footer
    'footer.tagline': 'Transformando ideias em experiências digitais excepcionais com precisão e criatividade.',
    'footer.services': 'Serviços',
    'footer.web': 'Desenvolvimento Web',
    'footer.mobile': 'Aplicações Móveis',
    'footer.software': 'Software Personalizado',
    'footer.design': 'Design UI/UX',
    
    'footer.company': 'Empresa',
    'footer.about': 'Sobre Nós',
    'footer.careers': 'Carreiras',
    'footer.blog': 'Blog',
    'footer.privacy': 'Política de Privacidade',
    
    'footer.contact': 'Contato',
    'footer.rights': 'Todos os direitos reservados.',
    'footer.terms': 'Termos de Serviço',
    'footer.cookies': 'Cookies',
  }
};

// Provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get initial language preference from localStorage or default to English
  const savedLanguage = localStorage.getItem('language') as Language;
  const [language, setLanguage] = useState<Language>(savedLanguage || 'en');

  // Function to change language
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function
  const translate = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => useContext(LanguageContext);
