import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language";
import { GlobeIcon } from "lucide-react";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "pt-BR" : "en");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 text-white/80 hover:text-white hover:bg-white/10"
    >
      <GlobeIcon className="size-4" />
      {language === "en" ? "PT" : "EN"}
    </Button>
  );
};

export default LanguageSwitcher;
