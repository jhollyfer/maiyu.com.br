
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-maiyu-dark pt-20 border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div>
            <Link to="/" className="text-3xl font-extrabold block mb-4">
              <span className="text-gradient">Maiyu.</span>
            </Link>
            <p className="text-white/60 mb-6">
              Transforming ideas into exceptional digital experiences with precision and creativity.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300 text-white/60 hover:text-white">
                <Github size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300 text-white/60 hover:text-white">
                <Linkedin size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300 text-white/60 hover:text-white">
                <Twitter size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-6">Services</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Web Development</a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Mobile Applications</a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Custom Software</a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">UI/UX Design</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">About Us</a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Careers</a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Blog</a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Privacy Policy</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-6">Contact</h3>
            <ul className="space-y-3">
              <li className="text-white/60">
                Maiyu Development Inc.
              </li>
              <li className="text-white/60">
                1234 Innovation Drive
              </li>
              <li className="text-white/60">
                San Francisco, CA 94107
              </li>
              <li>
                <a href="mailto:hello@maiyu.dev" className="text-maiyu-green hover:text-maiyu-green/80 transition-colors duration-300">hello@maiyu.dev</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © {currentYear} Maiyu Development. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-white/60 hover:text-white text-sm transition-colors duration-300">Terms of Service</a>
            <a href="#" className="text-white/60 hover:text-white text-sm transition-colors duration-300">Privacy Policy</a>
            <a href="#" className="text-white/60 hover:text-white text-sm transition-colors duration-300">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
