import { useLanguage } from "@/contexts/language";
import { AnimateInView, StaggerContainer, staggerItemVariants } from "@/components/motion/animate-in-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Home, Clock, Shield, GraduationCap, Globe, Briefcase, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";

const careerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  position: z.string().min(1, "Selecione uma vaga"),
  linkedin: z.string().url("URL inválida").or(z.literal("")),
});

type CareerFormValues = z.infer<typeof careerSchema>;

const jobs = [
  { title: "Senior Front-end Engineer", type: "Full-time", location: "Remoto" },
  { title: "Product Designer (UI/UX)", type: "Full-time", location: "Remoto" },
  { title: "Data Analyst", type: "Full-time", location: "Remoto" },
];

const Career = () => {
  const { t } = useLanguage();

  const form = useForm<CareerFormValues>({
    resolver: zodResolver(careerSchema),
    defaultValues: { name: "", email: "", position: "", linkedin: "" },
  });

  const onSubmit = (_data: CareerFormValues) => {
    toast.success(t("career.successMessage"));
    form.reset();
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 overflow-hidden bg-card">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <AnimateInView variant="fadeUp">
              <span className="inline-block px-4 py-1 rounded-full bg-maiyu-purple/20 text-maiyu-purple text-xs font-bold uppercase tracking-widest w-fit">
                {t("career.badge")}
              </span>
            </AnimateInView>
            <AnimateInView variant="fadeUp" delay={0.1}>
              <h1 className="text-foreground text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
                {t("career.heroTitle")}
              </h1>
            </AnimateInView>
            <AnimateInView variant="fadeUp" delay={0.2}>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-xl">
                {t("career.heroDescription")}
              </p>
            </AnimateInView>
            <AnimateInView variant="fadeUp" delay={0.3}>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex -space-x-3">
                  <img src="/jhollyfer.png" alt="Jhollyfer" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                  <img src="/lenny.png" alt="Lenny" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                  <img src="/geison.png" alt="Geison" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                  <img src="/matheus.png" alt="Matheus" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                </div>
                <span className="text-muted-foreground text-sm">{t("career.teamCount")}</span>
              </div>
            </AnimateInView>
          </div>

          {/* Application Form */}
          <AnimateInView variant="fadeUp" delay={0.2}>
            <Card className="bg-card border-border rounded-2xl shadow-2xl">
              <CardContent className="p-8">
                <h3 className="text-foreground text-2xl font-bold mb-6">{t("career.formTitle")}</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground text-sm">{t("career.nameLabel")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-muted border-border text-foreground rounded-xl"
                                placeholder={t("career.namePlaceholder")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground text-sm">{t("career.emailLabel")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                className="bg-muted border-border text-foreground rounded-xl"
                                placeholder="email@exemplo.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground text-sm">{t("career.positionLabel")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted border-border text-foreground rounded-xl">
                                <SelectValue placeholder={t("career.positionPlaceholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="frontend">Desenvolvedor Front-end Senior</SelectItem>
                              <SelectItem value="designer">Product Designer</SelectItem>
                              <SelectItem value="qa">QA Engineer</SelectItem>
                              <SelectItem value="backend">Desenvolvedor Back-end (Node.js)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground text-sm">{t("career.linkedinLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-muted border-border text-foreground rounded-xl"
                              placeholder="https://linkedin.com/in/voce"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full bg-maiyu-purple hover:bg-maiyu-purple/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                      >
                        {t("career.submitButton")}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-4">
                        {t("career.privacyNote")}
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </AnimateInView>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <AnimateInView variant="fadeUp">
            <div className="max-w-2xl mb-16">
              <h2 className="text-foreground text-3xl md:text-4xl font-extrabold mb-4">
                {t("career.benefitsTitle")}
              </h2>
              <p className="text-muted-foreground text-lg">
                {t("career.benefitsDescription")}
              </p>
            </div>
          </AnimateInView>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Home, title: t("career.benefit1Title"), desc: t("career.benefit1Desc") },
              { icon: Clock, title: t("career.benefit2Title"), desc: t("career.benefit2Desc") },
              { icon: Shield, title: t("career.benefit3Title"), desc: t("career.benefit3Desc") },
              { icon: GraduationCap, title: t("career.benefit4Title"), desc: t("career.benefit4Desc") },
            ].map((benefit) => (
              <motion.div key={benefit.title} variants={staggerItemVariants}>
                <Card className="group p-8 rounded-2xl bg-card border-border hover:border-maiyu-purple/50 transition-all h-full">
                  <CardContent className="p-0">
                    <div className="size-12 bg-maiyu-purple/10 rounded-xl flex items-center justify-center text-maiyu-purple mb-6 group-hover:scale-110 transition-transform">
                      <benefit.icon size={24} />
                    </div>
                    <h3 className="text-foreground text-xl font-bold mb-3">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-24 px-6 bg-secondary/50">
        <div className="max-w-5xl mx-auto">
          <AnimateInView variant="fadeUp">
            <div className="text-center mb-12">
              <h2 className="text-foreground text-3xl font-extrabold mb-4">{t("career.jobsTitle")}</h2>
              <p className="text-muted-foreground">{t("career.jobsDescription")}</p>
            </div>
          </AnimateInView>
          <div className="space-y-4">
            {jobs.map((job) => (
              <AnimateInView key={job.title} variant="fadeUp">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-card rounded-xl border border-border hover:border-maiyu-purple/30 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-lg font-bold text-foreground group-hover:text-maiyu-purple transition-colors">
                      {job.title}
                    </h4>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe size={14} /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase size={14} /> {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      className="border-maiyu-purple text-maiyu-purple hover:bg-maiyu-purple hover:text-white transition-all rounded-lg"
                    >
                      {t("career.viewDetails")}
                      <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </div>
                </div>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Career;
