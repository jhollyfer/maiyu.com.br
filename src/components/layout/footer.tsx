import { useLanguage } from "@/contexts/language";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-maiyu-dark pt-20 border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div>
            <Link to="/" className="text-3xl font-extrabold block mb-4">
              <span className="text-gradient">Maiyu.</span>
            </Link>
            <p className="text-white/60 mb-6">{t("footer.tagline")}</p>
            <p className="text-maiyu-green font-medium text-sm mb-6">
              {t("footer.amazon")}
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300 text-white/60 hover:text-white"
              >
                <Github size={18} />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300 text-white/60 hover:text-white"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300 text-white/60 hover:text-white"
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">{t("footer.services")}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.web")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.mobile")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.software")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.design")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.sustainable")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">{t("footer.company")}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.about")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.careers")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.blog")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t("footer.privacy")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">{t("footer.contact")}</h3>
            <ul className="space-y-3">
              <li className="text-white/60">Maiyu Development Inc.</li>
              <li className="text-white/60">
                Rua Gildo Sampaio, 140, CM Filadélfia
              </li>
              <li className="text-white/60">
                Benjamin Constant, Amazonas, Brazil
              </li>
              <li>
                <a
                  href="mailto:contato@maiyu.com"
                  className="text-maiyu-green hover:text-maiyu-green/80 transition-colors duration-300"
                >
                  contato@maiyu.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © {currentYear} Maiyu Development. {t("footer.rights")}
          </p>
          <div className="flex space-x-6">
            <a
              href="#"
              className="text-white/60 hover:text-white text-sm transition-colors duration-300"
            >
              {t("footer.terms")}
            </a>
            <a
              href="#"
              className="text-white/60 hover:text-white text-sm transition-colors duration-300"
            >
              {t("footer.privacy")}
            </a>
            <a
              href="#"
              className="text-white/60 hover:text-white text-sm transition-colors duration-300"
            >
              {t("footer.cookies")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
