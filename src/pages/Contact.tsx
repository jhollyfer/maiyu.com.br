import { AnimateInView } from "@/components/motion/animate-in-view";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const makeSchema = (t: (k: string) => string) =>
  z.object({
    firstName: z.string().min(1, t("form.required")),
    lastName: z.string().min(1, t("form.required")),
    email: z.string().email(t("form.invalidEmail")),
    message: z.string().min(10, t("form.minMessage")),
  });

type ContactFormValues = z.infer<ReturnType<typeof makeSchema>>;

const Contact = () => {
  const { t } = useLanguage();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { firstName: "", lastName: "", email: "", message: "" },
  });

  const onSubmit = () => {
    toast.success(t("contactPage.successMessage"));
    form.reset();
  };

  return (
    <div className="bg-background min-h-screen">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-paper pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-12 gap-8">
          <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-4">
            <p className="eyebrow">— {t("contactPage.eyebrow")}</p>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.1}
            className="col-span-12 md:col-span-8"
          >
            <h1 className="font-display text-display font-400 leading-[0.95] tracking-[-0.035em] text-foreground max-w-4xl">
              {t("contactPage.title")}
            </h1>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.2}
            className="col-span-12 md:col-span-6 md:col-start-7 mt-10"
          >
            <p className="font-sans text-body-lg text-foreground/75 leading-[1.65] max-w-xl">
              {t("contactPage.description")}
            </p>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Editorial split: form + imagery ───────────────────── */}
      <section className="pt-12 md:pt-16 pb-24 md:pb-32 bg-canvas-sand dark:bg-canvas-shale">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Form */}
          <AnimateInView variant="fadeUp" className="lg:col-span-7">
            <div className="bezel-shell">
              <div className="bezel-core p-8 md:p-12">
                <p className="eyebrow mb-6">— Write to us</p>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="eyebrow !mb-2 block">
                              {t("contactPage.firstName")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-12 bg-transparent border-0 border-b border-foreground/15 rounded-none px-0 font-sans text-body text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-[color:var(--color-forest)] transition-colors duration-[480ms]"
                                placeholder={t(
                                  "contactPage.firstNamePlaceholder",
                                )}
                              />
                            </FormControl>
                            <FormMessage className="text-[11px] font-sans" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="eyebrow !mb-2 block">
                              {t("contactPage.lastName")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-12 bg-transparent border-0 border-b border-foreground/15 rounded-none px-0 font-sans text-body text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-[color:var(--color-forest)] transition-colors duration-[480ms]"
                                placeholder={t(
                                  "contactPage.lastNamePlaceholder",
                                )}
                              />
                            </FormControl>
                            <FormMessage className="text-[11px] font-sans" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="eyebrow !mb-2 block">
                            {t("contactPage.emailLabel")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="h-12 bg-transparent border-0 border-b border-foreground/15 rounded-none px-0 font-sans text-body text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-[color:var(--color-forest)] transition-colors duration-[480ms]"
                              placeholder={t("contactPage.emailPlaceholder")}
                            />
                          </FormControl>
                          <FormMessage className="text-[11px] font-sans" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="eyebrow !mb-2 block">
                            {t("contactPage.messageLabel")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={5}
                              className="bg-transparent border-0 border-b border-foreground/15 rounded-none px-0 font-sans text-body text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-[color:var(--color-forest)] resize-none transition-colors duration-[480ms]"
                              placeholder={t("contactPage.messagePlaceholder")}
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
                          {t("contactPage.sendButton")}
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

          {/* Visual / testimonial */}
          <AnimateInView
            variant="fadeUp"
            delay={0.15}
            className="lg:col-span-5"
          >
            <div className="relative overflow-hidden rounded-[2rem] aspect-[4/5] md:aspect-auto md:h-full min-h-[480px] bg-canvas-forest dark:bg-canvas-night">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuD7PQcoK4zbyqjdzD35Dyp13ZMc7U2WpDFeo41gvARMf1-zompG8WNhHzFRJzPGmXGFzs8pROajoJMLgUUirJgZiQ4WjHm5-gRaijC2Tc_M_HfWnWDRY1TONC3W1ZJMsOabYETvR-tvtb1p1Tv-KwrY8DS1NVd7YA3ZViKrBVzqBuR7eA-o5mmebZzFXbykYH3vswhXvg4cxyDqaVGm1_RKrFtvEqnS3QVY5A0rsH7OxH6apAJMf3kzQZhFD8e42Ax3Bkv9qzLUt6Q")`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0B]/95 via-[#0B0F0B]/30 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <p className="font-sans text-micro tracking-[0.22em] uppercase font-medium text-[color:var(--color-canvas-cream)]/60 mb-5">
                  — A word from the team
                </p>
                <blockquote className="font-display text-h3 font-400 leading-[1.15] tracking-[-0.02em] text-[color:var(--color-canvas-cream)] italic">
                  &ldquo;{t("contactPage.testimonial")}&rdquo;
                </blockquote>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img
                      src="/jhollyfer.png"
                      alt="Jhollyfer"
                      className="size-9 rounded-full ring-2 ring-[#0B0F0B] object-cover"
                    />
                    <img
                      src="/lenny.png"
                      alt="Lenny"
                      className="size-9 rounded-full ring-2 ring-[#0B0F0B] object-cover"
                    />
                    <img
                      src="/matheus.png"
                      alt="Matheus"
                      className="size-9 rounded-full ring-2 ring-[#0B0F0B] object-cover"
                    />
                  </div>
                  <span className="font-sans text-small text-[color:var(--color-canvas-cream)]/70">
                    Maiyu Team — Benjamin Constant
                  </span>
                </div>
              </div>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Contact info grid — forest narrative ──────────────── */}
      <section className="relative pb-32 md:pb-40 bg-canvas-forest dark:bg-canvas-night text-[color:var(--color-canvas-cream)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(216,138,43,0.1),_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-20 md:pt-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {[
              {
                icon: Mail,
                title: t("contactPage.emailTitle"),
                subtitle: t("contactPage.emailSubtitle"),
                values: [
                  {
                    text: "contato@maiyu.com",
                    href: "mailto:contato@maiyu.com",
                  },
                  {
                    text: "suporte@maiyu.com",
                    href: "mailto:suporte@maiyu.com",
                  },
                ],
              },
              {
                icon: Phone,
                title: t("contactPage.phoneTitle"),
                subtitle: t("contactPage.phoneSubtitle"),
                values: [
                  { text: "+55 (97) 9 8431-7149", href: "tel:+5597984317149" },
                  { text: "+55 (97) 9 8414-5765", href: "tel:+5597984145765" },
                ],
              },
              {
                icon: MapPin,
                title: t("contactPage.locationTitle"),
                subtitle: t("contactPage.locationSubtitle"),
                values: [
                  { text: "Rua Gildo Sampaio, 140" },
                  { text: "CM Filadelfia — Benjamin Constant, AM" },
                ],
              },
            ].map((info, i) => (
              <AnimateInView key={info.title} variant="fadeUp" delay={i * 0.08}>
                <div className="flex flex-col gap-5 pt-8 border-t border-[color:var(--color-canvas-cream)]/[0.15]">
                  <div className="flex items-center gap-3">
                    <info.icon
                      size={16}
                      strokeWidth={1.4}
                      className="text-[color:var(--color-amber)]"
                    />
                    <p className="font-sans text-micro tracking-[0.22em] uppercase font-medium text-[color:var(--color-canvas-cream)]/55">
                      — {info.title}
                    </p>
                  </div>
                  <h3 className="font-display text-h3 font-400 tracking-[-0.02em] text-[color:var(--color-canvas-cream)]">
                    {info.subtitle}
                  </h3>
                  <div className="flex flex-col gap-1 mt-2">
                    {info.values.map((val) =>
                      "href" in val && val.href ? (
                        <a
                          key={val.text}
                          className="group inline-flex items-center gap-1 font-sans text-body text-[color:var(--color-canvas-cream)]/80 hover:text-[color:var(--color-amber)] transition-colors duration-[480ms] w-fit"
                          href={val.href}
                        >
                          {val.text}
                          <ArrowUpRight
                            size={12}
                            strokeWidth={1.4}
                            className="opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[480ms]"
                          />
                        </a>
                      ) : (
                        <p
                          key={val.text}
                          className="font-sans text-body text-[color:var(--color-canvas-cream)]/80"
                        >
                          {val.text}
                        </p>
                      ),
                    )}
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

export default Contact;
