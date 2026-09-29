import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
import { PageHero } from "@/components/page-hero";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/language";
import { jobs } from "@/data/jobs";
import { cn, fieldCls, labelCls } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowDown, Clock, GraduationCap, Home as HomeIcon, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { team } from "@/data/team";
import { z } from "zod";

const makeSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().min(1, t("form.required")),
    email: z.string().email(t("form.invalidEmail")),
    position: z.string().min(1, t("form.selectPosition")),
    linkedin: z.string().url(t("form.invalidUrl")).or(z.literal("")),
  });

type CareerFormValues = z.infer<ReturnType<typeof makeSchema>>;

const TINTS = ["bg-tint-mint", "bg-tint-peach", "bg-tint-mist", "bg-tint-lime"];

const Career = () => {
  const { t } = useLanguage();

  const form = useForm<CareerFormValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { name: "", email: "", position: "", linkedin: "" },
  });

  const onSubmit = () => {
    toast.success(t("career.successMessage"));
    form.reset();
  };

  const benefits = [
    { icon: HomeIcon, n: 1 },
    { icon: Clock, n: 2 },
    { icon: Shield, n: 3 },
    { icon: GraduationCap, n: 4 },
  ];

  return (
    <>
      <PageHero
        title={t("career.heroTitle")}
        lead={t("career.heroDescription")}
      >
        <div className="mt-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {team.map((m) => (
              <img
                key={m.name}
                src={m.img}
                alt={m.name}
                className="size-10 rounded-full bg-tint-mint object-cover ring-2 ring-background"
              />
            ))}
          </div>
          <p className="text-small text-foreground/80">{t("career.teamCount")}</p>
        </div>
      </PageHero>

      {/* Benefits */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <AnimateInView className="mb-12 max-w-2xl">
            <h2 className="text-h1">{t("career.benefitsTitle")}</h2>
            <p className="mt-5 font-serif text-lead text-foreground/75">
              {t("career.benefitsDescription")}
            </p>
          </AnimateInView>
          <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {benefits.map((b, i) => (
              <motion.div
                key={b.n}
                variants={staggerItemVariants}
                className={cn("flex flex-col gap-10 rounded-[1.75rem] p-7 md:p-9", TINTS[i])}
              >
                <b.icon size={24} strokeWidth={1.5} />
                <div>
                  <h3 className="text-h3">{t(`career.benefit${b.n}Title`)}</h3>
                  <p className="mt-3 max-w-[44ch] text-body text-foreground/75">
                    {t(`career.benefit${b.n}Desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Open positions */}
      <section className="bg-surface py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-12 md:px-8">
          <AnimateInView className="md:col-span-4">
            <h2 className="text-h1">{t("career.jobsTitle")}</h2>
            <p className="mt-5 font-serif text-lead text-foreground/75">
              {t("career.jobsDescription")}
            </p>
          </AnimateInView>
          <StaggerContainer className="flex flex-col gap-3 md:col-span-8">
            {jobs.map((job) => (
              <motion.a
                key={job.id}
                variants={staggerItemVariants}
                href="#apply"
                className="group flex items-center justify-between gap-6 rounded-2xl bg-background px-6 py-5 transition-colors hover:bg-tint-mint"
              >
                <div>
                  <h3 className="text-h4 font-medium">{t(job.titleKey)}</h3>
                  <p className="mt-1 text-small text-muted-foreground">
                    {t(`career.jobLocation.${job.location}`)}, {t(`career.jobType.${job.type}`)}
                  </p>
                </div>
                <ArrowDown
                  size={18}
                  strokeWidth={1.5}
                  className="shrink-0 transition-transform duration-300 group-hover:translate-y-0.5"
                />
              </motion.a>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="scroll-mt-20 py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:px-8 lg:grid-cols-12">
          <AnimateInView className="lg:col-span-5">
            <h2 className="text-h1">{t("career.formTitle")}</h2>
            <p className="mt-5 font-serif text-lead text-foreground/75">
              {t("career.formSubtitle")}
            </p>
          </AnimateInView>

          <AnimateInView delay={0.1} className="lg:col-span-7">
            <div className="rounded-[1.75rem] bg-tint-mist p-6 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelCls}>{t("career.nameLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="name"
                              className={fieldCls}
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
                          <FormLabel className={labelCls}>{t("career.emailLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              autoComplete="email"
                              className={fieldCls}
                              placeholder={t("career.emailPlaceholder")}
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
                        <FormLabel className={labelCls}>{t("career.positionLabel")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(fieldCls, "w-full")}>
                              <SelectValue placeholder={t("career.positionPlaceholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="frontend">{t("career.selectFrontend")}</SelectItem>
                            <SelectItem value="designer">{t("career.selectDesigner")}</SelectItem>
                            <SelectItem value="qa">{t("career.selectQa")}</SelectItem>
                            <SelectItem value="backend">{t("career.selectBackend")}</SelectItem>
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
                        <FormLabel className={labelCls}>{t("career.linkedinLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            className={fieldCls}
                            placeholder={t("career.linkedinPlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-small text-foreground/70">{t("career.privacyNote")}</p>
                    <button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      className="h-12 shrink-0 rounded-full bg-primary px-7 text-small font-medium text-primary-foreground transition-colors hover:bg-primary/85 active:scale-[0.98] disabled:opacity-60"
                    >
                      {t("career.submitButton")}
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </AnimateInView>
        </div>
      </section>
    </>
  );
};

export default Career;
