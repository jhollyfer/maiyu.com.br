
import React, { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import Projects from '@/components/sections/Projects';
import Team from '@/components/sections/Team';
import Contact from '@/components/sections/Contact';

const Index = () => {
  // Smooth scroll handling for hash links
  useEffect(() => {
    // If there's a hash in the URL, scroll to it after the page loads
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-maiyu-dark text-white overflow-hidden">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Projects />
        <Team />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
