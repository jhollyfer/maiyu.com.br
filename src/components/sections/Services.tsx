
import React from 'react';
import { Code, Smartphone, Server, Database, Palette, Leaf } from 'lucide-react';
import ServiceCard from '../ui/ServiceCard';
import AnimatedCard from '../ui/AnimatedCard';
import { useLanguage } from '@/contexts/LanguageContext';

const Services = () => {
  const { t } = useLanguage();

  const services = [
    {
      title: t('services.web.title'),
      description: t('services.web.description'),
      icon: Code,
    },
    {
      title: t('services.mobile.title'),
      description: t('services.mobile.description'),
      icon: Smartphone,
    },
    {
      title: t('services.backend.title'),
      description: t('services.backend.description'),
      icon: Server,
    },
    {
      title: t('services.database.title'),
      description: t('services.database.description'),
      icon: Database,
    },
    {
      title: t('services.design.title'),
      description: t('services.design.description'),
      icon: Palette,
    },
    {
      title: t('services.sustainable.title'),
      description: t('services.sustainable.description'),
      icon: Leaf,
    },
  ];

  return (
    <section id="services" className="section-padding overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-1/3 left-0 w-1/2 h-1/2 bg-maiyu-purple/5 rounded-full filter blur-3xl z-0"></div>
      <div className="absolute bottom-1/3 right-0 w-1/2 h-1/2 bg-maiyu-green/5 rounded-full filter blur-3xl z-0"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <AnimatedCard className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-block py-1 px-4 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-maiyu-green mb-6">
            {t('services.title')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('services.heading')} <span className="text-gradient">{t('services.headingGradient')}</span>
          </h2>
          <p className="text-white/70 text-lg">
            {t('services.description')}
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <AnimatedCard key={index} delay={index * 100}>
              <ServiceCard
                title={service.title}
                description={service.description}
                icon={service.icon}
              />
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
