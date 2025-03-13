
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available languages
type Language = 'en' | 'pt-BR';

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
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.projects': 'Projects',
    'nav.team': 'Team',
    'nav.contact': 'Contact',
    'nav.getInTouch': 'Get in Touch',
    'nav.toggleTheme': 'Toggle Theme',
    
    'hero.tagline': 'Innovative Software Solutions',
    'hero.title': 'Turning Ideas into',
    'hero.titleGradient': 'Digital Reality',
    'hero.description': 'We build custom software solutions that help businesses transform their operations and deliver exceptional experiences to their customers.',
    'hero.startProject': 'Start a Project',
    'hero.ourServices': 'Our Services',
    'hero.trustedBy': 'TRUSTED BY INNOVATIVE COMPANIES',
    'hero.scrollDown': 'Scroll Down',
    
    'services.title': 'Our Services',
    'services.subtitle': 'What We Do Best',
    'services.webDev': 'Web Development',
    'services.webDevDesc': 'Modern, responsive websites and web applications using the latest technologies.',
    'services.mobileDev': 'Mobile Development',
    'services.mobileDevDesc': 'Native and cross-platform mobile applications for iOS and Android.',
    'services.uiux': 'UI/UX Design',
    'services.uiuxDesc': 'User-centered design that creates intuitive and engaging experiences.',
    'services.cloud': 'Cloud Solutions',
    'services.cloudDesc': 'Scalable cloud infrastructure and services for your applications.',
    'services.ai': 'AI Integration',
    'services.aiDesc': 'Implement artificial intelligence to automate processes and gain insights.',
    'services.consulting': 'Tech Consulting',
    'services.consultingDesc': 'Strategic technology planning and digital transformation guidance.',
    
    'projects.title': 'Our Work',
    'projects.subtitle': 'Recent Projects',
    'projects.viewAll': 'View All Projects',
    'projects.caseStudy': 'Case Study',
    
    'team.title': 'Our Team',
    'team.subtitle': 'Meet the Experts',
    'team.ceo': 'CEO & Founder',
    'team.cto': 'CTO',
    'team.designer': 'Lead Designer',
    'team.developer': 'Senior Developer',
    
    'contact.title': 'Get in Touch',
    'contact.subtitle': 'Start a Conversation',
    'contact.name': 'Your Name',
    'contact.email': 'Your Email',
    'contact.message': 'Your Message',
    'contact.send': 'Send Message',
    'contact.address': 'Our Address',
    'contact.phone': 'Phone Number',
    'contact.emailUs': 'Email Us',
    
    'footer.rights': 'All rights reserved',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
  },
  'pt-BR': {
    'nav.home': 'Início',
    'nav.services': 'Serviços',
    'nav.projects': 'Projetos',
    'nav.team': 'Equipe',
    'nav.contact': 'Contato',
    'nav.getInTouch': 'Fale Conosco',
    'nav.toggleTheme': 'Alternar Tema',
    
    'hero.tagline': 'Soluções de Software Inovadoras',
    'hero.title': 'Transformando Ideias em',
    'hero.titleGradient': 'Realidade Digital',
    'hero.description': 'Desenvolvemos soluções de software personalizadas que ajudam empresas a transformar suas operações e entregar experiências excepcionais aos seus clientes.',
    'hero.startProject': 'Iniciar Projeto',
    'hero.ourServices': 'Nossos Serviços',
    'hero.trustedBy': 'CONFIADO POR EMPRESAS INOVADORAS',
    'hero.scrollDown': 'Rolar para Baixo',
    
    'services.title': 'Nossos Serviços',
    'services.subtitle': 'O Que Fazemos de Melhor',
    'services.webDev': 'Desenvolvimento Web',
    'services.webDevDesc': 'Sites e aplicações web modernas e responsivas utilizando as tecnologias mais recentes.',
    'services.mobileDev': 'Desenvolvimento Mobile',
    'services.mobileDevDesc': 'Aplicativos nativos e multiplataforma para iOS e Android.',
    'services.uiux': 'Design UI/UX',
    'services.uiuxDesc': 'Design centrado no usuário que cria experiências intuitivas e envolventes.',
    'services.cloud': 'Soluções em Nuvem',
    'services.cloudDesc': 'Infraestrutura e serviços em nuvem escaláveis para suas aplicações.',
    'services.ai': 'Integração de IA',
    'services.aiDesc': 'Implementação de inteligência artificial para automatizar processos e obter insights.',
    'services.consulting': 'Consultoria Tecnológica',
    'services.consultingDesc': 'Planejamento estratégico de tecnologia e orientação para transformação digital.',
    
    'projects.title': 'Nosso Trabalho',
    'projects.subtitle': 'Projetos Recentes',
    'projects.viewAll': 'Ver Todos os Projetos',
    'projects.caseStudy': 'Estudo de Caso',
    
    'team.title': 'Nossa Equipe',
    'team.subtitle': 'Conheça os Especialistas',
    'team.ceo': 'CEO & Fundador',
    'team.cto': 'CTO',
    'team.designer': 'Designer Chefe',
    'team.developer': 'Desenvolvedor Sênior',
    
    'contact.title': 'Fale Conosco',
    'contact.subtitle': 'Inicie uma Conversa',
    'contact.name': 'Seu Nome',
    'contact.email': 'Seu Email',
    'contact.message': 'Sua Mensagem',
    'contact.send': 'Enviar Mensagem',
    'contact.address': 'Nosso Endereço',
    'contact.phone': 'Telefone',
    'contact.emailUs': 'Email',
    
    'footer.rights': 'Todos os direitos reservados',
    'footer.privacy': 'Política de Privacidade',
    'footer.terms': 'Termos de Serviço',
  }
};

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  
  useEffect(() => {
    // Get language from localStorage or use browser language (defaulting to 'en')
    const savedLanguage = localStorage.getItem('language') as Language;
    
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pt-BR')) {
      setLanguageState(savedLanguage);
    } else {
      // Check browser language preference
      const browserLang = navigator.language;
      if (browserLang.startsWith('pt')) {
        setLanguageState('pt-BR');
      }
    }
  }, []);
  
  // Update language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };
  
  // Translation function
  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    
    // Fallback to English
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
