
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import AnimatedCard from '../ui/AnimatedCard';
import { useLanguage } from '@/contexts/LanguageContext';

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation would go here
    
    // Simulating form submission
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
      duration: 5000,
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      company: '',
      message: '',
    });
  };
  
  return (
    <section id="contact" className="section-padding bg-gradient-to-b from-maiyu-dark/95 to-maiyu-dark relative">
      <div className="container mx-auto px-6 relative z-10">
        <AnimatedCard className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-block py-1 px-4 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-maiyu-green mb-6">
            {t('contact.title')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('contact.subtitle')}
          </h2>
          <p className="text-white/70 text-lg">
            {t('projects.description')}
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <AnimatedCard>
            <div className="glass-card p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-6">{t('contact.send')}</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-white/70 mb-2 text-sm">{t('contact.name')}</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-maiyu-purple/50 transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-white/70 mb-2 text-sm">{t('contact.email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-maiyu-purple/50 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label htmlFor="company" className="block text-white/70 mb-2 text-sm">{t('contact.company')}</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-maiyu-purple/50 transition-all duration-300"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="message" className="block text-white/70 mb-2 text-sm">{t('contact.message')}</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-maiyu-purple/50 transition-all duration-300 resize-none"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-lg bg-gradient-to-r from-maiyu-purple to-maiyu-blue text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-maiyu-purple/20"
                >
                  {t('contact.send')}
                </button>
              </form>
            </div>
          </AnimatedCard>
          
          <AnimatedCard delay={200}>
            <div className="lg:pl-10">
              <h3 className="text-2xl font-bold mb-8">{t('contact.title')}</h3>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold text-maiyu-green mb-2">{t('contact.address')}</h4>
                  <p className="text-white/70">1234 Innovation Drive</p>
                  <p className="text-white/70">Manaus, Amazonas, Brazil</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-maiyu-green mb-2">{t('contact.emailUs')}</h4>
                  <p>
                    <a href="mailto:hello@maiyu.dev" className="text-white/70 hover:text-white transition-colors duration-300">
                      hello@maiyu.dev
                    </a>
                  </p>
                  <p>
                    <a href="mailto:support@maiyu.dev" className="text-white/70 hover:text-white transition-colors duration-300">
                      support@maiyu.dev
                    </a>
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-maiyu-green mb-2">{t('contact.phone')}</h4>
                  <p>
                    <a href="tel:+15551234567" className="text-white/70 hover:text-white transition-colors duration-300">
                      +55 (92) 1234-5678
                    </a>
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-maiyu-green mb-4">{t('footer.amazon')}</h4>
                  <div className="flex space-x-4">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
};

export default Contact;
