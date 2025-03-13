
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface TeamCardProps {
  name: string;
  role: string;
  image: string;
  delay?: number;
}

const TeamCard: React.FC<TeamCardProps> = ({ 
  name, 
  role, 
  image,
  delay = 0
}) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className="glass-card rounded-xl overflow-hidden group transition-all duration-500 text-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-t from-maiyu-dark via-transparent to-transparent' : 'bg-gradient-to-t from-gray-800/30 via-transparent to-transparent'} z-10`} />
        <img 
          src={image} 
          alt={name} 
          className="w-full aspect-square object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className={`text-xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{name}</h3>
        <p className={theme === 'dark' ? 'text-maiyu-green/80' : 'text-maiyu-purple'}>{role}</p>
      </div>
    </div>
  );
};

export default TeamCard;
