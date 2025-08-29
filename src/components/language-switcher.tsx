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
      className="gap-2"
    >
      <GlobeIcon className="size-4 text-primary" />{" "}
      {language === "en" ? "PT" : "EN"}
    </Button>
  );
};

export default LanguageSwitcher;
