import { useLanguage } from "@/contexts/language";
import { useTheme } from "@/contexts/theme";
import { cn } from "@/lib/utils";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "../language-switcher";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const resolvedTheme = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const navLinks = [
    { name: t("nav.home"), to: "/" },
    { name: t("nav.portfolio"), to: "/portfolio" },
    { name: t("nav.blog"), to: "/blog" },
    { name: t("nav.career"), to: "/career" },
    { name: t("nav.contact"), to: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[padding,background-color,box-shadow] duration-300 py-6",
        scrolled &&
          "py-4 shadow-lg border-b border-border bg-background/88 backdrop-blur-[18px]"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-heading font-extrabold relative z-20">
          <span className="text-gradient">Maiyu.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <ul className="flex space-x-6">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground font-body text-xs tracking-wider uppercase relative overflow-hidden group py-2 transition-colors duration-300"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-full h-px bg-maiyu-amber origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
              </li>
            ))}
          </ul>

          <LanguageSwitcher />

          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to="/contact"
            className="inline-flex items-center py-2 px-5 bg-maiyu-amber text-maiyu-dark font-body text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:brightness-110"
          >
            {t("nav.getInTouch")}
          </Link>
        </nav>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center space-x-4">
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 z-20"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="text-foreground z-20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "fixed inset-0 z-10 flex flex-col justify-center transition-transform duration-300 ease-in-out border-r border-border bg-background",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <nav className="container px-6">
            <ul className="flex flex-col space-y-6 items-center">
              {navLinks.map((link) => (
                <li key={link.name} className="w-full">
                  <Link
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground font-body text-xs tracking-[0.25em] uppercase block w-full text-center py-3 transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li className="pt-4 w-full">
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3.5 px-6 bg-maiyu-amber text-maiyu-dark font-body text-sm font-bold tracking-wider uppercase block text-center"
                >
                  {t("nav.getInTouch")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
