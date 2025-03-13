
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ProjectCardProps {
  title: string;
  description: string;
  tech: string[];
  image: string;
  delay?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  title, 
  description, 
  tech, 
  image,
  delay = 0
}) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className="glass-card rounded-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 ${theme === 'dark' 
          ? 'bg-gradient-to-t from-maiyu-dark to-transparent' 
          : 'bg-gradient-to-t from-gray-800/30 to-transparent'} z-10 opacity-0 group-hover:opacity-70 transition-opacity duration-500`} />
        <img 
          src={image} 
          alt={title} 
          className="w-full aspect-video object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
        />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' 
          ? 'text-white group-hover:text-maiyu-green' 
          : 'text-gray-800 group-hover:text-maiyu-purple'} transition-colors duration-300`}>{title}</h3>
        <p className={`${theme === 'dark' ? 'text-white/70' : 'text-gray-600'} mb-5 flex-1`}>{description}</p>
        <div className="flex flex-wrap gap-2">
          {tech.map((item, i) => (
            <span 
              key={i} 
              className={`text-xs py-1 px-3 rounded-full ${theme === 'dark' 
                ? 'bg-white/10 text-white/80 border border-white/5' 
                : 'bg-maiyu-purple/10 text-gray-700 border border-maiyu-purple/20'}`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
