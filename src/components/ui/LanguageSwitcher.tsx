
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-flex">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'pt-BR')}
        className="appearance-none bg-white/5 border border-white/10 rounded-full text-white py-1.5 pl-3 pr-8 cursor-pointer hover:bg-white/10 transition-colors"
      >
        <option value="en">EN</option>
        <option value="pt-BR">PT</option>
      </select>
      <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-white/70">
        ▼
      </span>
    </div>
  );
};

export default LanguageSwitcher;
