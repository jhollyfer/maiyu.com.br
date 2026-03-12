import { useLanguage } from "@/contexts/language";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const contactSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const Contact = () => {
  const { t } = useLanguage();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { firstName: "", lastName: "", email: "", message: "" },
  });

  const onSubmit = (_data: ContactFormValues) => {
    toast.success(t("contactPage.successMessage"));
    form.reset();
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Contact Split Section */}
      <section className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden pt-20">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 bg-card p-8 md:p-16 lg:p-24 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <AnimateInView variant="fadeUp">
              <div className="mb-10">
                <span className="text-maiyu-purple font-bold tracking-widest uppercase text-xs">
                  {t("contactPage.subtitle")}
                </span>
                <h2 className="text-foreground text-4xl md:text-5xl font-extrabold mt-4 mb-6 leading-tight">
                  {t("contactPage.title")}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {t("contactPage.description")}
                </p>
              </div>
            </AnimateInView>

            <AnimateInView variant="fadeUp" delay={0.1}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-sm font-semibold">{t("contactPage.firstName")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-14 bg-muted border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-maiyu-purple"
                              placeholder="e.g. Jane"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-sm font-semibold">{t("contactPage.lastName")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-14 bg-muted border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-maiyu-purple"
                              placeholder="e.g. Doe"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground text-sm font-semibold">{t("contactPage.emailLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="h-14 bg-muted border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-maiyu-purple"
                            placeholder="jane@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground text-sm font-semibold">{t("contactPage.messageLabel")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-muted border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-maiyu-purple resize-none"
                            placeholder={t("contactPage.messagePlaceholder")}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-maiyu-purple hover:brightness-110 text-white h-14 rounded-xl font-bold text-lg transition-all shadow-xl shadow-maiyu-purple/10"
                  >
                    {t("contactPage.sendButton")}
                  </Button>
                </form>
              </Form>
            </AnimateInView>
          </div>
        </div>

        {/* Right Side: Image + Quote */}
        <div className="w-full lg:w-1/2 min-h-[400px] lg:min-h-0 relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuD7PQcoK4zbyqjdzD35Dyp13ZMc7U2WpDFeo41gvARMf1-zompG8WNhHzFRJzPGmXGFzs8pROajoJMLgUUirJgZiQ4WjHm5-gRaijC2Tc_M_HfWnWDRY1TONC3W1ZJMsOabYETvR-tvtb1p1Tv-KwrY8DS1NVd7YA3ZViKrBVzqBuR7eA-o5mmebZzFXbykYH3vswhXvg4cxyDqaVGm1_RKrFtvEqnS3QVY5A0rsH7OxH6apAJMf3kzQZhFD8e42Ax3Bkv9qzLUt6Q")`,
            }}
          />
          <div className="absolute inset-0 bg-maiyu-purple/10 mix-blend-multiply" />
          <div className="absolute bottom-10 left-10 right-10 bg-background/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-border">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-3">
                <img src="/jhollyfer.png" alt="Jhollyfer" className="size-10 rounded-full border-2 border-background object-cover" />
                <img src="/lenny.png" alt="Lenny" className="size-10 rounded-full border-2 border-background object-cover" />
                <img src="/geison.png" alt="Geison" className="size-10 rounded-full border-2 border-background object-cover" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">{t("contactPage.happyClients")}</p>
            </div>
            <blockquote className="italic text-foreground/80 font-medium">
              "{t("contactPage.testimonial")}"
            </blockquote>
            <p className="mt-2 font-bold text-maiyu-purple">
              — Maiyu Team
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Grid */}
      <section className="bg-secondary/50 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: Mail,
              title: t("contactPage.emailTitle"),
              subtitle: t("contactPage.emailSubtitle"),
              values: [
                { text: "contato@maiyu.com", href: "mailto:contato@maiyu.com" },
                { text: "suporte@maiyu.com", href: "mailto:suporte@maiyu.com" },
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
                { text: "Rua Gildo Sampaio, 140, CM Filadelfia, Benjamin Constant, AM" },
              ],
            },
          ].map((info) => (
            <AnimateInView key={info.title} variant="fadeUp">
              <div className="flex items-start gap-5">
                <div className="size-12 rounded-xl bg-maiyu-purple/10 text-maiyu-purple flex items-center justify-center shrink-0">
                  <info.icon size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-1">{info.title}</h4>
                  <p className="text-muted-foreground mb-2">{info.subtitle}</p>
                  {info.values.map((val) => (
                    val.href ? (
                      <a key={val.text} className="text-maiyu-purple font-bold hover:underline block" href={val.href}>
                        {val.text}
                      </a>
                    ) : (
                      <p key={val.text} className="text-foreground font-bold">{val.text}</p>
                    )
                  ))}
                </div>
              </div>
            </AnimateInView>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Contact;
