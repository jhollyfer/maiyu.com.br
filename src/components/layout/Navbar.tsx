
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  
  const navLinks = [
    { name: t('nav.home'), href: '#home' },
    { name: t('nav.services'), href: '#services' },
    { name: t('nav.projects'), href: '#projects' },
    { name: t('nav.team'), href: '#team' },
    { name: t('nav.contact'), href: '#contact' },
  ];
  
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-6",
        scrolled && "bg-maiyu-dark/70 backdrop-blur-lg py-4 shadow-lg"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-2xl font-extrabold relative z-20"
        >
          <span className="text-gradient">Maiyu.</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <ul className="flex space-x-8">
            {navLinks.map((link) => (
              <li key={link.name}>
                <button
                  onClick={() => scrollToSection(link.href)}
                  className="text-white/80 hover:text-white font-medium relative overflow-hidden group py-2 transition-colors duration-300"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-maiyu-green origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </button>
              </li>
            ))}
          </ul>
          
          <LanguageSwitcher />
          
          <button 
            onClick={() => scrollToSection('#contact')}
            className="inline-flex items-center py-2.5 px-6 rounded-full bg-gradient-to-r from-maiyu-purple to-maiyu-blue text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-maiyu-purple/20 hover:scale-105"
          >
            {t('nav.getInTouch')}
          </button>
        </nav>
        
        <div className="md:hidden flex items-center space-x-4">
          <LanguageSwitcher />
          
          <button 
            className="text-white z-20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile menu */}
        <div 
          className={cn(
            "fixed inset-0 z-10 bg-maiyu-dark/95 backdrop-blur-lg flex flex-col justify-center transition-transform duration-300 ease-in-out",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <nav className="container px-6">
            <ul className="flex flex-col space-y-6 items-center">
              {navLinks.map((link) => (
                <li key={link.name} className="w-full">
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-white/80 hover:text-white font-medium text-xl block w-full text-center py-3"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
              <li className="pt-4 w-full">
                <button 
                  onClick={() => scrollToSection('#contact')}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-maiyu-purple to-maiyu-blue text-white font-medium"
                >
                  {t('nav.getInTouch')}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
