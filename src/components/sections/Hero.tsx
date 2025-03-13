
import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import ScrollIndicator from '../ui/ScrollIndicator';
import { useLanguage } from '@/contexts/LanguageContext';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <section 
      id="home" 
      className="min-h-screen relative flex flex-col justify-center pt-20 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-maiyu-purple/10 rounded-full filter blur-3xl z-0 animate-float"></div>
      <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-maiyu-blue/10 rounded-full filter blur-3xl z-0 animate-float"></div>
      
      {/* Main content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block py-1 px-4 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-maiyu-green mb-6">
              {t('hero.tagline')}
            </span>
          </div>
          
          <h1 className={`text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            {t('hero.title')} <span className="text-gradient">{t('hero.titleGradient')}</span>
          </h1>
          
          <p className={`text-xl text-white/70 mb-12 max-w-3xl mx-auto transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            {t('hero.description')}
          </p>
          
          <div className={`flex flex-col sm:flex-row justify-center gap-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <a 
              href="#contact" 
              className="inline-flex items-center justify-center py-3.5 px-8 rounded-full bg-gradient-to-r from-maiyu-purple to-maiyu-blue text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-maiyu-purple/20 hover:scale-105"
            >
              {t('hero.startProject')}
              <ArrowRight size={18} className="ml-2" />
            </a>
            <a 
              href="#services" 
              className="inline-flex items-center justify-center py-3.5 px-8 rounded-full bg-white/5 border border-white/10 text-white font-medium transition-all duration-300 hover:bg-white/10"
            >
              {t('hero.ourServices')}
            </a>
          </div>
        </div>
        
        {/* Featured tech logos */}
        <div className={`mt-24 md:mt-32 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/40 text-sm text-center mb-8">{t('hero.trustedBy')}</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="w-20 h-12 flex items-center justify-center opacity-50 hover:opacity-80 transition-opacity duration-300">
              <svg viewBox="0 0 248 31" className="w-full h-auto">
                <path fill="currentColor" d="M25.4 26.4h-4.9v-14h-2v-4.1h2V7c0-5.4 2.2-8.1 8.2-8.1h4.9v4.9h-3.1c-2.3 0-2.5 0.9-2.5 2.6v1.9h5.6v4.1h-5.6v14h-2.6zM39 26.4h2.7V8.3H39V26.4zM38.4 3.4c0-1.6 1.3-2.9 2.9-2.9 1.6 0 2.9 1.3 2.9 2.9s-1.3 2.9-2.9 2.9c-1.6 0-2.9-1.3-2.9-2.9zM47.7 17.3c0-9.9 5.3-13.7 12.7-13.7 7.4 0 12.7 3.8 12.7 13.7s-5.3 13.7-12.7 13.7c-7.4 0-12.7-3.8-12.7-13.7zM53.5 17.3c0 6.1 1.9 8.9 6.9 8.9s6.9-2.8 6.9-8.9-1.9-8.9-6.9-8.9-6.9 2.8-6.9 8.9zM88.9 14.8c0-6.4-2.1-8.5-6.5-8.5-4.2 0-6 2.1-6 6.5v13.6H73.6V0h2.7v12.1c1.2-2.6 3.9-4.2 8.4-4.2 6.2 0 9.4 3 9.4 10.7v7.7H94v-11.6h-5.1v0.1zM97.9 26.4h2.7V0h-2.7v26.4zM108.9 26.4h2.7V8.3h-2.7V26.4zM108.3 3.4c0-1.6 1.3-2.9 2.9-2.9 1.6 0 2.9 1.3 2.9 2.9s-1.3 2.9-2.9 2.9c-1.6 0-2.9-1.3-2.9-2.9zM123.2 30.5c5.9 0 7.5-2.3 7.5-9.1v-13h-2.7v14.1c0 3.9-0.8 5.1-4.8 5.1-0.6 0-1.3 0-1.8-0.1v3c0.5 0 1.2 0 1.8 0zM131.1 3.4c0-1.6 1.3-2.9 2.9-2.9 1.6 0 2.9 1.3 2.9 2.9s-1.3 2.9-2.9 2.9c-1.6 0-2.9-1.3-2.9-2.9zM159.9 26.4h-2.8l-6.1-18.1h-0.2l-6.1 18.1h-2.8l-7.8-18.1h2.9l5.9 15.6h0.2l6-15.6h2.7l6 15.6h0.2l5.9-15.6h2.9l-7.9 18.1zM180.3 26.4h-2.7v-3.4h-0.2c-1.2 2.4-3.9 4-7.3 4-4.8 0-6.5-2.9-6.5-7.1V8.3h2.7v10.7c0 3.4 0.7 5.3 4.1 5.3 3.7 0 6.4-2.9 6.4-6.5V8.3h2.7v18.1h0.8zM199.5 24.9c0 4.9-2.5 6.7-9.2 6.7-5.7 0-8.9-1.9-8.9-6.2h2.7c0 2.9 1.9 3.7 6.3 3.7 4.7 0 6.4-1 6.4-4 0-2.9-1.2-3.4-7.8-4.3-6.5-0.9-9.1-1.9-9.1-6.1 0-4.4 3.6-6.2 8.5-6.2 5.6 0 8.4 2 8.4 6.2h-2.7c0-2.9-1.7-3.6-5.7-3.6-4.1 0-5.9 1-5.9 3.6 0 2.4 1 2.9 8 3.9 6.5 0.8 8.9 2 8.9 6.3zM210.5 26.4h-2.7V8.3h2.7v4.4h0.2c1.2-3 3.4-4.9 7.2-4.9 0.6 0 1.1 0.1 1.6 0.2v2.6c-0.3-0.1-1.2-0.2-1.8-0.2-4.6 0-7.2 3.6-7.2 7.9v8.1zM238.6 23.7c-1.6 2-4.3 3.3-7.9 3.3-7.1 0-11.3-4.1-11.3-13.2 0-9.1 4.2-13.2 11.3-13.2 7.5 0 10.6 5 10.6 12.6v1.8h-18.8c0 5.9 2.3 8.7 7.6 8.7 2.9 0 5.1-1.4 6.2-2.9l2.3 2.9zM237.6 12.8c-0.2-5-2.8-7.5-6.9-7.5-4.1 0-6.2 2.5-6.9 7.5h13.8zM247.1 26.4h-2.7V8.3h2.7v18.1zM246.5 3.4c0-1.6 1.3-2.9 2.9-2.9 1.6 0 2.9 1.3 2.9 2.9s-1.3 2.9-2.9 2.9c-1.6 0-2.9-1.3-2.9-2.9z"></path>
              </svg>
            </div>
            <div className="w-20 h-12 flex items-center justify-center opacity-50 hover:opacity-80 transition-opacity duration-300">
              <svg viewBox="0 0 124 34" className="w-full h-auto">
                <path fill="currentColor" d="M24.4 11.6h-8.9v3.6h5.2c-.2 3.4-2.9 4.8-5.3 4.8-3.3 0-6.3-2.5-6.3-6.4S12 7.1 15.4 7.1c1.7 0 3.3.7 4.4 2l2.7-2.6C20.6 4.5 18.1 3 15 3 9.2 3 5 7.6 5 13.6s4.2 10.6 10.3 10.6c5.3 0 9.4-3.6 9.4-9.6 0-1.4-.1-2-.3-3zm17 1.2c-3 0-5.3 2.3-5.3 5.2 0 2.8 2 5.2 5.5 5.2 2.3 0 3.6-1.1 4.5-2.2l-1.9-1.3c-.6.8-1.3 1.3-2.6 1.3-1.6 0-2.4-.9-2.9-1.8l8-.3V17c0-4-2.8-6.2-5.3-6.2zm-5 4.2c.1-1.1.9-2.5 2.7-2.5 1.5 0 2.2.9 2.5 1.7l-5.2.8zm22.3-3.8H56l-5 12.7h3l1.3-3.6h5.5l1.4 3.6h3l-5.1-12.7zm-1.6 6.8l1.9-4.9 1.9 4.9h-3.8zM80 13h-2.8v-1.9h-3V13h-1.7v2.3h1.7v5.9c0 3.7 3.1 3.6 5.5 3.4V22c-.7.1-1.9.2-2.5-.3-.3-.3-.3-.8-.3-1.4v-5.1H80V13zm10.3 0c-1 0-2.1.4-2.5 1.6V13h-2.9v11.1h3v-5.8c0-1.9 1-2.7 2.3-2.7.9 0 1.3.3 1.6.6l.9-2.7c-.5-.3-1.2-.5-2.4-.5zm12.1 8.7c-.9 0-1.1-.7-1.1-1.9v-4.2h2.3V13h-2.3V9.5h-3V13h-1.7v2.3h1.7v4.8c0 3.2 1.8 4.1 4.3 4.1.5 0 1.3 0 1.7-.1v-2.5c-.2.1-.6.1-.9.1zm7.9-5.9c-3.7 0-5.6 3.1-5.6 6.1 0 3.5 2.2 6.1 5.9 6.1 2.2 0 3.7-.8 4.9-2.3l-1.7-1.6c-.6.8-1.6 1.4-3 1.4-1.8 0-3.1-1.3-3.1-2.9h8.1v-1.2c0-3.5-2.1-5.6-5.5-5.6zm-2.6 4.3c.1-.7.8-2.1 2.5-2.1 1.7 0 2.3 1.3 2.3 2.1h-4.8zM124 13l-2.9 7.6-2.9-7.6h-3.2l4.7 11.9-2.7 6h3l7.7-17.9z"></path>
              </svg>
            </div>
            <div className="w-20 h-12 flex items-center justify-center opacity-50 hover:opacity-80 transition-opacity duration-300">
              <svg viewBox="0 0 245 77" className="w-full h-auto">
                <path fill="currentColor" d="M46.1 62.5c-5.6 0-10.7-2.3-14.3-6L44 44.4c1-1 1-2.6 0-3.6L31.8 28.5c3.6-3.7 8.7-6 14.3-6 11.1 0 20.1 9 20.1 20s-9 20-20.1 20zm-31.4-7l9.3-9.4c.4-.4.4-1 0-1.4l-9.3-9.4C13 29.5 12 23.8 12 18c0-7.9 2.9-15.1 7.6-20.6C8.6 8.3 1.5 25.1 1.5 44c0 6.6.9 13 2.6 19.1 2.5-2.5 6.4-7.7 10.6-7.7zM46.3 0C35.9 0 26.5 5 20.7 12.8 52.2 13.4 77 38 77.5 69.3 85.4 63.5 90.4 54.2 90.4 44 90.4 19.7 70.7 0 46.3 0z"></path>
              </svg>
            </div>
            <div className="w-20 h-12 flex items-center justify-center opacity-50 hover:opacity-80 transition-opacity duration-300">
              <svg viewBox="0 0 514 170" className="w-full h-auto">
                <path fill="currentColor" d="M175 131.2c21.1 0 35.6-15.3 35.6-35.6 0-20.4-14.4-35.6-35.6-35.6-21.1 0-35.6 15.3-35.6 35.6 0 20.4 14.4 35.6 35.6 35.6zm0-13.4c-12.3 0-20.6-9.2-20.6-22.2 0-13 8.3-22.2 20.6-22.2s20.6 9.2 20.6 22.2c0 13-8.3 22.2-20.6 22.2zM323.5 131.2c21.1 0 35.6-15.3 35.6-35.6 0-20.4-14.4-35.6-35.6-35.6S288 75.3 288 95.6c0 20.4 14.4 35.6 35.5 35.6zm0-13.4c-12.3 0-20.6-9.2-20.6-22.2 0-13 8.3-22.2 20.6-22.2s20.6 9.2 20.6 22.2c0 13-8.3 22.2-20.6 22.2zM407.5 129h14.4V73.6c0-17.5-13.1-26.2-30.2-26.2-12.3 0-20.6 4.9-26.7 12.3l9.9 9.2c3.4-5.3 8.8-8.5 15.6-8.5 9.6 0 15.3 5.7 15.3 13v10.9c-4.6-6.1-11.4-9.6-20.6-9.6-19.1 0-33.7 14.1-33.7 33.7 0 19.5 14.6 33.7 33.7 33.7 9.2 0 16-3.4 20.6-9.6l1.7 6.5zm-21-13.4c-11.4 0-19.5-8.5-19.5-20.2 0-11.8 8-20.2 19.5-20.2 11.8 0 19.8 8.5 19.8 20.2 0 11.8-8 20.2-19.8 20.2zM217.1 61.3V129h14.9V93.3c0-11.8 8.5-18.7 17.5-18.7 9.6 0 14.9 6.5 14.9 16.8V129h14.9V88.8c0-18.7-10.3-29.1-24.8-29.1-9.2 0-17.5 4.2-22.5 11.4V61.3h-14.9zM486.1 129V32.2h14.9V129h-14.9zM148.9 37.5h-35.2V129h14.9V94.8h20.2c18.7 0 32.9-13.4 32.9-28.6 0-15.3-14.2-28.7-32.8-28.7zm-1.5 43.9h-18.7V51h18.7c10.3 0 17.9 6.5 17.9 15.3 0 8.7-7.7 15.1-17.9 15.1zM486.1 37.5V17.2h-14.9v20.2h14.9zM13.2 152.9H-6.3L39 46.2h19.5l45.3 106.7h-19.5l-9.2-23H22.4l-9.2 23zm35.6-40.5l-13-32.9-13 32.9h26zM265.5 152.9l-29.8-49.3-15.6 17.5v31.7h-17.9V46.2h17.9v53.2l43.5-53.2h21.3L249.6 88l39.3 64.9h-23.4z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <ScrollIndicator />
    </section>
  );
};

export default Hero;
