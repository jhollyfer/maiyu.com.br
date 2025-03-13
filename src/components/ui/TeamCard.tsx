
import React from 'react';

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
  return (
    <div 
      className="glass-card rounded-xl overflow-hidden group transition-all duration-500 text-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-maiyu-dark via-transparent to-transparent z-10" />
        <img 
          src={image} 
          alt={name} 
          className="w-full aspect-square object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-1 text-white">{name}</h3>
        <p className="text-maiyu-green/80">{role}</p>
      </div>
    </div>
  );
};

export default TeamCard;
