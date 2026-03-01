import { useLanguage } from "@/contexts/language";
import { Github, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-maiyu-dark pt-20 border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <div>
            <Link to="/" className="text-3xl font-extrabold block mb-4">
              <span className="text-gradient">Maiyu.</span>
            </Link>
            <p className="text-white/60 mb-6">{t("footer.tagline")}</p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/maiyu-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300 text-white/60 hover:text-white"
              >
                <Github size={18} />
              </a>
              <a
                href="https://linkedin.com/company/maiyu"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300 text-white/60 hover:text-white"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">{t("footer.services")}</h3>
            <ul className="space-y-3">
              <li className="text-white/60">{t("footer.web")}</li>
              <li className="text-white/60">{t("footer.mobile")}</li>
              <li className="text-white/60">{t("footer.software")}</li>
              <li className="text-white/60">{t("footer.design")}</li>
              <li className="text-white/60">{t("footer.sustainable")}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">{t("footer.contact")}</h3>
            <ul className="space-y-3">
              <li className="text-white/60">Maiyu SH</li>
              <li className="text-white/60">
                Rua Gildo Sampaio, 140, CM Filadelfia
              </li>
              <li className="text-white/60">
                Benjamin Constant, Amazonas, Brasil
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
            &copy; {currentYear} Maiyu SH. {t("footer.rights")}
          </p>
          <div className="flex space-x-6">
            <span className="text-white/40 text-sm">{t("footer.terms")}</span>
            <span className="text-white/40 text-sm">{t("footer.privacy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
