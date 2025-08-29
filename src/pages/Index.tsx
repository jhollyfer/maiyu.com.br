import LanguageSwitcher from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/contexts/language";

const Index = () => {
  const { t } = useLanguage();

  const services = [
    {
      title: t("services.web.title"),
      desc: t("services.web.description"),
      icon: "💻",
    },
    {
      title: t("services.mobile.title"),
      desc: t("services.mobile.description"),
      icon: "📱",
    },
    {
      title: t("services.backend.title"),
      desc: t("services.backend.description"),
      icon: "⚙️",
    },
    {
      title: t("services.database.title"),
      desc: t("services.database.description"),
      icon: "🗄️",
    },
    {
      title: t("services.design.title"),
      desc: t("services.design.description"),
      icon: "🎨",
    },
    {
      title: t("services.sustainable.title"),
      desc: t("services.sustainable.description"),
      icon: "🌱",
    },
  ];

  const projects = [
    {
      title: t("projects.amazon.title"),
      desc: t("projects.amazon.description"),
      tech: ["Python", "TensorFlow", "React", "AWS"],
    },
    {
      title: t("projects.fintech.title"),
      desc: t("projects.fintech.description"),
      tech: ["React", "TypeScript", "Node.js", "MongoDB"],
    },
    {
      title: t("projects.ecommerce.title"),
      desc: t("projects.ecommerce.description"),
      tech: ["Next.js", "GraphQL", "Stripe", "PostgreSQL"],
    },
    {
      title: t("projects.healthcare.title"),
      desc: t("projects.healthcare.description"),
      tech: ["React Native", "Firebase", "Redux", "WebRTC"],
    },
  ];

  const teamMembers = [
    {
      name: t("team.jhollyfer.name"),
      role: t("team.jhollyfer.role"),
      // icon: "👨‍💻",
      image: "/public/jhollyfer.png",
    },
    {
      name: t("team.lenny.name"),
      role: t("team.lenny.role"),
      // icon: "🎨",
      image: "/public/lenny.png",
    },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Maiyu</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline">{t("nav.contact")}</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          {/* <Badge variant="secondary" className="mb-6">
            {t("hero.tagline")}
          </Badge> */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t("hero.title")}{" "}
            <span className="text-primary">{t("hero.titleGradient")}</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {t("hero.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              {t("hero.startProject")}
            </Button>
            <Button size="lg" variant="outline">
              {t("hero.ourServices")}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">🌿</span>
            {t("hero.amazon")}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            {/* <Badge variant="secondary" className="mb-6">
              {t("services.title")}
            </Badge> */}
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("services.heading")}{" "}
              <span className="text-primary">
                {t("services.headingGradient")}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("services.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300"
              >
                <CardHeader>
                  <div className="text-4xl mb-2">{service.icon}</div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{service.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            {/* <Badge variant="secondary" className="mb-6">
              {t("projects.title")}
            </Badge> */}
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("projects.heading")}{" "}
              <span className="text-primary">
                {t("projects.headingGradient")}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("projects.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {projects.map((project, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription>{project.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, techIndex) => (
                      <Badge
                        key={techIndex}
                        variant="outline"
                        className="text-xs"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline">
              {t("projects.startYourProject")}
            </Button>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            {/* <Badge variant="secondary" className="mb-6">
              {t("team.title")}
            </Badge> */}
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("team.heading")}{" "}
              <span className="text-primary">{t("team.headingGradient")}</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("team.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-all duration-300"
              >
                <CardHeader className="items-center justify-center w-full">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full"
                  />
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          {/* <Badge variant="secondary" className="mb-6">
            {t("contact.title")}
          </Badge> */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t("contact.subtitle")}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {t("projects.description")}
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 mb-12">
            {t("contact.send")}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-semibold mb-2 text-primary">
                {t("contact.address")}
              </h3>
              <p className="text-muted-foreground">
                Rua Gildo Sampaio, 140, CM Filadélfia
                <br />
                Benjamin Constant, Amazonas, Brasil
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-primary">
                {t("contact.emailUs")}
              </h3>
              <p className="text-muted-foreground">
                contato@maiyu.com
                <br />
                suporte@maiyu.com
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-primary">
                {t("contact.phone")}
              </h3>
              <p className="text-muted-foreground">
                +55 (97) 9 8431-7149
                <br />
                +55 (92) 9 8633-1746
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p className="mb-2">
            © {new Date().getFullYear()} Maiyu Software House.{" "}
            {t("footer.rights")}
          </p>
          <p className="text-primary">🌿 {t("footer.amazon")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
