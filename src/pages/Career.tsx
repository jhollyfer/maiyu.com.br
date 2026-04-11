import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Clock,
  GraduationCap,
  Home as HomeIcon,
  Shield,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const makeSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().min(1, t("form.required")),
    email: z.string().email(t("form.invalidEmail")),
    position: z.string().min(1, t("form.selectPosition")),
    linkedin: z.string().url(t("form.invalidUrl")).or(z.literal("")),
  });

type CareerFormValues = z.infer<ReturnType<typeof makeSchema>>;

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
    {
      icon: HomeIcon,
      title: t("career.benefit1Title"),
      desc: t("career.benefit1Desc"),
      num: "01",
    },
    {
      icon: Clock,
      title: t("career.benefit2Title"),
      desc: t("career.benefit2Desc"),
      num: "02",
    },
    {
      icon: Shield,
      title: t("career.benefit3Title"),
      desc: t("career.benefit3Desc"),
      num: "03",
    },
    {
      icon: GraduationCap,
      title: t("career.benefit4Title"),
      desc: t("career.benefit4Desc"),
      num: "04",
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-paper pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-12 gap-8">
          <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-4">
            <p className="eyebrow">— {t("career.heroEyebrow")}</p>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.1}
            className="col-span-12 md:col-span-8"
          >
            <h1 className="font-display text-display font-400 leading-[0.95] tracking-[-0.035em] text-foreground max-w-4xl">
              {t("career.heroTitle")}
            </h1>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.2}
            className="col-span-12 md:col-span-6 md:col-start-7 mt-10"
          >
            <p className="font-sans text-body-lg text-foreground/75 leading-[1.65] max-w-xl mb-8">
              {t("career.heroDescription")}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <img
                  src="/jhollyfer.png"
                  alt="Jhollyfer"
                  className="size-10 rounded-full ring-2 ring-background object-cover"
                />
                <img
                  src="/lenny.png"
                  alt="Lenny"
                  className="size-10 rounded-full ring-2 ring-background object-cover"
                />
                <img
                  src="/matheus.png"
                  alt="Matheus"
                  className="size-10 rounded-full ring-2 ring-background object-cover"
                />
              </div>
              <p className="font-sans text-small text-muted-foreground">
                {t("career.teamCount")}
              </p>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Application form — editorial card ─────────────────── */}
      <section className="pt-12 md:pt-16 pb-24 md:pb-32 bg-canvas-sand dark:bg-canvas-shale">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <AnimateInView variant="fadeUp" className="lg:col-span-5">
              <p className="eyebrow mb-5">— {t("career.formTitle")}</p>
              <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-foreground max-w-md">
                {t("career.formSubtitle")}
              </h2>
              <p className="font-sans text-body text-foreground/70 mt-6 leading-relaxed max-w-sm">
                {t("career.privacyNote")}
              </p>
            </AnimateInView>

            <AnimateInView
              variant="fadeUp"
              delay={0.1}
              className="lg:col-span-7"
            >
              <div className="bezel-shell">
                <div className="bezel-core p-8 md:p-10">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="eyebrow !mb-2 block">
                                {t("career.nameLabel")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-12 bg-transparent border-0 border-b border-foreground/15 rounded-none px-0 font-sans text-body text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-[color:var(--color-forest)] transition-colors duration-[480ms]"
                                  placeholder={t("career.namePlaceholder")}
                                />
                              </FormControl>
                              <FormMessage className="text-[11px] font-sans" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="eyebrow !mb-2 block">
                                {t("career.emailLabel")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  className="h-12 bg-transparent border-0 border-b border-foreground/15 rounded-none px-0 font-sans text-body text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-[color:var(--color-forest)] transition-colors duration-[480ms]"
                                  placeholder={t("career.emailPlaceholder")}
                                />
                              </FormControl>
                              <FormMessage className="text-[11px] font-sans" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="eyebrow !mb-2 block">
                              {t("career.positionLabel")}
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 bg-transparent border-0 border-b border-foreground/15 rounded-none px-0 font-sans text-body focus:ring-0 focus-visible:ring-0 focus:border-[color:var(--color-forest)] transition-colors duration-[480ms]">
                                  <SelectValue
                                    placeholder={t(
                                      "career.positionPlaceholder",
                                    )}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-2xl border border-foreground/10 bg-background/95 backdrop-blur-xl">
                                <SelectItem value="frontend">
                                  {t("career.selectFrontend")}
                                </SelectItem>
                                <SelectItem value="designer">
                                  {t("career.selectDesigner")}
                                </SelectItem>
                                <SelectItem value="qa">
                                  {t("career.selectQa")}
                                </SelectItem>
                                <SelectItem value="backend">
                                  {t("career.selectBackend")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[11px] font-sans" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="eyebrow !mb-2 block">
                              {t("career.linkedinLabel")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-12 bg-transparent border-0 border-b border-foreground/15 rounded-none px-0 font-sans text-body text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-[color:var(--color-forest)] transition-colors duration-[480ms]"
                                placeholder={t("career.linkedinPlaceholder")}
                              />
                            </FormControl>
                            <FormMessage className="text-[11px] font-sans" />
                          </FormItem>
                        )}
                      />

                      <div className="pt-6">
                        <button
                          type="submit"
                          className="group inline-flex items-center gap-1 pl-7 pr-1.5 py-1.5 rounded-full bg-foreground text-background font-sans text-[13px] font-medium tracking-[0.02em] transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color:var(--color-forest)] hover:text-[color:var(--color-canvas-cream)] dark:hover:bg-[color:var(--color-forest-bright)] active:scale-[0.97]"
                        >
                          <span className="py-2.5">
                            {t("career.submitButton")}
                          </span>
                          <span className="ml-2 flex size-9 items-center justify-center rounded-full bg-background/15 group-hover:bg-background/25 transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <ArrowUpRight size={14} strokeWidth={1.6} />
                          </span>
                        </button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </AnimateInView>
          </div>
        </div>
      </section>

      {/* ─── Benefits — forest narrative block ────────────────── */}
      <section className="relative py-24 md:py-32 bg-canvas-forest dark:bg-canvas-night text-[color:var(--color-canvas-cream)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(216,138,43,0.08),_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-12 gap-8 mb-16 md:mb-20">
            <AnimateInView
              variant="fadeUp"
              className="col-span-12 md:col-span-4"
            >
              <p className="font-sans text-micro tracking-[0.22em] uppercase font-medium text-[color:var(--color-canvas-cream)]/55">
                — {t("career.benefitsEyebrow")}
              </p>
            </AnimateInView>
            <AnimateInView
              variant="fadeUp"
              delay={0.1}
              className="col-span-12 md:col-span-8"
            >
              <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-[color:var(--color-canvas-cream)] max-w-3xl">
                {t("career.benefitsTitle")}
              </h2>
              <p className="font-sans text-body-lg text-[color:var(--color-canvas-cream)]/70 mt-6 max-w-xl leading-relaxed">
                {t("career.benefitsDescription")}
              </p>
            </AnimateInView>
          </div>

          <StaggerContainer className="flex flex-col">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                variants={staggerItemVariants}
                className={`group grid grid-cols-12 gap-4 md:gap-8 py-10 border-t border-[color:var(--color-canvas-cream)]/[0.1] ${
                  i === benefits.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="col-span-2 md:col-span-1">
                  <span className="font-mono text-small text-[color:var(--color-amber)] tabular-nums">
                    {benefit.num}
                  </span>
                </div>
                <div className="col-span-10 md:col-span-4 flex items-center gap-3">
                  <benefit.icon
                    size={16}
                    strokeWidth={1.4}
                    className="text-[color:var(--color-amber)]"
                  />
                  <h3 className="font-display text-h3 font-400 tracking-[-0.02em] text-[color:var(--color-canvas-cream)]">
                    {benefit.title}
                  </h3>
                </div>
                <div className="col-span-12 md:col-span-6 md:col-start-7">
                  <p className="font-sans text-body text-[color:var(--color-canvas-cream)]/70 leading-relaxed max-w-lg">
                    {benefit.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Open positions — table-like editorial list ───────── */}
      <section className="py-24 md:py-32 bg-canvas-bone dark:bg-canvas-moss">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-12 gap-8 mb-14">
            <AnimateInView
              variant="fadeUp"
              className="col-span-12 md:col-span-4"
            >
              <p className="eyebrow">— {t("career.jobsEyebrow")}</p>
            </AnimateInView>
            <AnimateInView
              variant="fadeUp"
              delay={0.1}
              className="col-span-12 md:col-span-8"
            >
              <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-foreground max-w-3xl">
                {t("career.jobsTitle")}
              </h2>
              <p className="font-sans text-body text-foreground/70 mt-5 max-w-lg">
                {t("career.jobsDescription")}
              </p>
            </AnimateInView>
          </div>

          <StaggerContainer className="flex flex-col">
            {jobs.map((job, i) => (
              <motion.a
                key={job.id}
                variants={staggerItemVariants}
                href="#"
                className={`group grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 border-t border-foreground/[0.1] items-center transition-[padding-left] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:pl-4 md:hover:pl-6 ${
                  i === jobs.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="col-span-1">
                  <span className="font-mono text-small text-muted-foreground tabular-nums">
                    0{i + 1}
                  </span>
                </div>
                <div className="col-span-11 md:col-span-6">
                  <h4 className="font-display text-h3 font-400 tracking-[-0.02em] text-foreground group-hover:text-[color:var(--color-forest)] dark:group-hover:text-[color:var(--color-forest-bright)] transition-colors duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                    {t(job.titleKey)}
                  </h4>
                </div>
                <div className="hidden md:flex md:col-span-4 gap-6 text-muted-foreground">
                  <span className="font-sans text-small">
                    {t(`career.jobLocation.${job.location}`)}
                  </span>
                  <span className="size-1 rounded-full bg-muted-foreground/40 mt-[7px]" />
                  <span className="font-sans text-small">
                    {t(`career.jobType.${job.type}`)}
                  </span>
                </div>
                <div className="hidden md:flex md:col-span-1 justify-end">
                  <ArrowUpRight
                    size={20}
                    strokeWidth={1.3}
                    className="text-muted-foreground transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-[color:var(--color-amber)] group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>
              </motion.a>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
};

export default Career;
