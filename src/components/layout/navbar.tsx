import { useLanguage } from "@/contexts/language";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "../language-switcher";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { name: t("nav.home"), href: "#home" },
    { name: t("nav.services"), href: "#services" },
    { name: t("nav.projects"), href: "#projects" },
    { name: t("nav.team"), href: "#team" },
    { name: t("nav.contact"), href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string, duration = 1400) => {
    setMobileMenuOpen(false);
    const target = document.getElementById(sectionId.replace("#", ""));
    if (!target) return;

    const start = window.scrollY;
    const end = target.getBoundingClientRect().top + start;
    const startTime = performance.now();

    // Ease in-out cubic
    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start + (end - start) * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-6",
        scrolled &&
          "py-4 shadow-lg border-b border-white/5"
      )}
      style={
        scrolled
          ? { backgroundColor: "rgba(8,15,11,0.85)", backdropFilter: "blur(16px)" }
          : undefined
      }
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-heading font-black relative z-20">
          <span className="text-gradient">Maiyu.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <ul className="flex space-x-6">
            {navLinks.map((link) => (
              <li key={link.name}>
                <button
                  onClick={() => scrollToSection(link.href)}
                  className="text-white/60 hover:text-white font-body text-xs tracking-wider uppercase relative overflow-hidden group py-2 transition-colors duration-300"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-full h-px bg-maiyu-amber origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </button>
              </li>
            ))}
          </ul>

          <LanguageSwitcher />

          <button
            onClick={() => scrollToSection("#contact")}
            className="inline-flex items-center py-2 px-5 bg-maiyu-amber text-maiyu-dark font-body text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:brightness-110"
          >
            {t("nav.getInTouch")}
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center space-x-4">
          <LanguageSwitcher />
          <button
            className="text-white z-20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "fixed inset-0 z-10 flex flex-col justify-center transition-transform duration-300 ease-in-out border-r border-white/5",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          style={{ backgroundColor: "#080f0b" }}
        >
          <nav className="container px-6">
            <ul className="flex flex-col space-y-6 items-center">
              {navLinks.map((link) => (
                <li key={link.name} className="w-full">
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-white/60 hover:text-white font-body text-xs tracking-[0.25em] uppercase block w-full text-center py-3 transition-colors duration-300"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
              <li className="pt-4 w-full">
                <button
                  onClick={() => scrollToSection("#contact")}
                  className="w-full py-3.5 px-6 bg-maiyu-amber text-maiyu-dark font-body text-sm font-bold tracking-wider uppercase"
                >
                  {t("nav.getInTouch")}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
