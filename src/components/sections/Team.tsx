
import React from 'react';
import TeamCard from '../ui/TeamCard';
import AnimatedCard from '../ui/AnimatedCard';
import { useLanguage } from '@/contexts/LanguageContext';

const Team = () => {
  const { t } = useLanguage();

  const teamMembers = [
    {
      name: t('team.alex.name'),
      role: t('team.alex.role'),
      image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3',
    },
    {
      name: t('team.sophia.name'),
      role: t('team.sophia.role'),
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3',
    },
    {
      name: t('team.james.name'),
      role: t('team.james.role'),
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3',
    },
    {
      name: t('team.olivia.name'),
      role: t('team.olivia.role'),
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3',
    },
  ];

  return (
    <section id="team" className="section-padding overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-1/4 right-0 w-1/3 h-1/3 bg-maiyu-purple/5 rounded-full filter blur-3xl z-0"></div>
      <div className="absolute bottom-1/4 left-0 w-1/3 h-1/3 bg-maiyu-blue/5 rounded-full filter blur-3xl z-0"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <AnimatedCard className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-block py-1 px-4 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-maiyu-green mb-6">
            {t('team.title')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('team.heading')} <span className="text-gradient">{t('team.headingGradient')}</span>
          </h2>
          <p className="text-white/70 text-lg">
            {t('team.description')}
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <AnimatedCard key={index} delay={index * 150}>
              <TeamCard
                name={member.name}
                role={member.role}
                image={member.image}
              />
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
