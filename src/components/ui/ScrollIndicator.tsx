
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ScrollIndicator = () => {
  const { t } = useLanguage();
  
  const scrollToContent = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer" 
      onClick={scrollToContent}
    >
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/70 mb-2">{t('hero.scrollDown')}</span>
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center items-start p-1">
          <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-scroll-down" />
        </div>
      </div>
    </div>
  );
};

export default ScrollIndicator;
