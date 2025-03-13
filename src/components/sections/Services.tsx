
import React from 'react';
import { Code, Smartphone, Server, Database, Palette } from 'lucide-react';
import ServiceCard from '../ui/ServiceCard';
import AnimatedCard from '../ui/AnimatedCard';

const services = [
  {
    title: 'Web Development',
    description: 'We build responsive, high-performance web applications using cutting-edge technologies that deliver exceptional user experiences.',
    icon: Code,
  },
  {
    title: 'Mobile Applications',
    description: 'Native and cross-platform mobile apps that provide seamless experiences across iOS and Android devices.',
    icon: Smartphone,
  },
  {
    title: 'Backend Development',
    description: 'Robust server-side solutions that power your applications with reliability, security, and scalability.',
    icon: Server,
  },
  {
    title: 'Database Solutions',
    description: 'Optimized database architecture and management for efficient data storage, retrieval, and analysis.',
    icon: Database,
  },
  {
    title: 'UI/UX Design',
    description: 'Beautiful, intuitive interfaces designed with your users in mind, ensuring engagement and satisfaction.',
    icon: Palette,
  },
];

const Services = () => {
  return (
    <section id="services" className="section-padding overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-1/3 left-0 w-1/2 h-1/2 bg-maiyu-purple/5 rounded-full filter blur-3xl z-0"></div>
      <div className="absolute bottom-1/3 right-0 w-1/2 h-1/2 bg-maiyu-blue/5 rounded-full filter blur-3xl z-0"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <AnimatedCard className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-block py-1 px-4 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-maiyu-green mb-6">
            Our Expertise
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Innovative Solutions for <span className="text-gradient">Modern Challenges</span>
          </h2>
          <p className="text-white/70 text-lg">
            We offer a comprehensive range of software development services tailored to meet your specific business needs and objectives.
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
