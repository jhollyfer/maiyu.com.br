
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center gap-2">
      <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-maiyu-purple' : 'text-white/70'}`} />
      <Switch 
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        aria-label={t('nav.toggleTheme')}
      />
      <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-maiyu-blue' : 'text-black/70'}`} />
    </div>
  );
};

export default ThemeToggle;
