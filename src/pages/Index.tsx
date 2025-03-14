import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Contact from "@/pages/components/contact";
import Hero from "@/pages/components/hero";
import Projects from "@/pages/components/projects";
import Services from "@/pages/components/services";
import Team from "@/pages/components/team";
import { useEffect } from "react";

const Index = () => {
  // Smooth scroll handling for hash links
  useEffect(() => {
    // If there's a hash in the URL, scroll to it after the page loads
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    }
  }, []);

  return (
    <div className="min-h-screen dark">
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
