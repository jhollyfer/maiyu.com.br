
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  title, 
  description, 
  icon: Icon,
  delay = 0
}) => {
  return (
    <div 
      className="glass-card p-8 rounded-xl backdrop-blur-md group hover:bg-white/10 transition-all duration-500 h-full"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-4 mb-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-maiyu-purple/20 to-maiyu-blue/20 text-maiyu-green group-hover:from-maiyu-purple/30 group-hover:to-maiyu-blue/30 transition-all duration-500">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-4 text-white group-hover:text-maiyu-green transition-colors duration-300">{title}</h3>
      <p className="text-white/70 group-hover:text-white/80 transition-colors duration-300">{description}</p>
    </div>
  );
};

export default ServiceCard;
