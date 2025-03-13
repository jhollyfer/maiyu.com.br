
import React from 'react';
import ProjectCard from '../ui/ProjectCard';
import AnimatedCard from '../ui/AnimatedCard';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Projects = () => {
  const { t } = useLanguage();

  const projects = [
    {
      title: t('projects.amazon.title'),
      description: t('projects.amazon.description'),
      tech: ['Python', 'TensorFlow', 'React', 'AWS'],
      image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3',
    },
    {
      title: t('projects.fintech.title'),
      description: t('projects.fintech.description'),
      tech: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3',
    },
    {
      title: t('projects.ecommerce.title'),
      description: t('projects.ecommerce.description'),
      tech: ['Next.js', 'GraphQL', 'Stripe', 'PostgreSQL'],
      image: 'https://images.unsplash.com/photo-1556742077-0a6b6a4a4ac4?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3',
    },
    {
      title: t('projects.healthcare.title'),
      description: t('projects.healthcare.description'),
      tech: ['React Native', 'Firebase', 'Redux', 'WebRTC'],
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3',
    },
  ];

  return (
    <section id="projects" className="section-padding bg-gradient-to-b from-maiyu-dark to-maiyu-dark/95 relative">
      <div className="container mx-auto px-6 relative z-10">
        <AnimatedCard className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-block py-1 px-4 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-maiyu-green mb-6">
            {t('projects.title')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('projects.heading')} <span className="text-gradient">{t('projects.headingGradient')}</span>
          </h2>
          <p className="text-white/70 text-lg">
            {t('projects.description')}
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {projects.map((project, index) => (
            <AnimatedCard key={index} delay={index * 150}>
              <ProjectCard
                title={project.title}
                description={project.description}
                tech={project.tech}
                image={project.image}
              />
            </AnimatedCard>
          ))}
        </div>
        
        <AnimatedCard className="text-center" delay={450}>
          <a 
            href="#contact" 
            className="inline-flex items-center py-3 px-6 rounded-full bg-white/5 border border-white/10 text-white font-medium transition-all duration-300 hover:bg-white/10"
          >
            {t('projects.startYourProject')}
            <ArrowRight size={18} className="ml-2" />
          </a>
        </AnimatedCard>
      </div>
    </section>
  );
};

export default Projects;
