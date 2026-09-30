import { AnimateInView } from "@/components/motion/animate-in-view";
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
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language";
import { cn, fieldCls, labelCls } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Phone } from "lucide-react";
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

  const info = [
    {
      icon: Mail,
      tone: "bg-tint-mint",
      title: t("contactPage.emailTitle"),
      subtitle: t("contactPage.emailSubtitle"),
      values: [
        { text: "contato@maiyu.com", href: "mailto:contato@maiyu.com" },
        { text: "suporte@maiyu.com", href: "mailto:suporte@maiyu.com" },
      ],
    },
    {
      icon: Phone,
      tone: "bg-tint-peach",
      title: t("contactPage.phoneTitle"),
      subtitle: t("contactPage.phoneSubtitle"),
      values: [
        { text: "+55 (97) 9 8431-7149", href: "tel:+5597984317149" },
        { text: "+55 (97) 9 8414-5765", href: "tel:+5597984145765" },
      ],
    },
    {
      icon: MapPin,
      tone: "bg-tint-lime",
      title: t("contactPage.locationTitle"),
      subtitle: t("contactPage.locationSubtitle"),
      values: [
        { text: "Rua Gildo Sampaio, 140" },
        { text: "CM Filadelfia, Benjamin Constant, AM" },
      ],
    },
  ];

  return (
    <>
      <PageHero
        pill={t("contactPage.eyebrow")}
        title={t("contactPage.title")}
        lead={t("contactPage.description")}
      />

      <section className="pb-24 md:pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 md:px-8 lg:grid-cols-12">
          <AnimateInView className="lg:col-span-7">
            <div className="rounded-[1.75rem] bg-tint-mist p-6 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelCls}>{t("contactPage.firstName")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="given-name"
                              className={fieldCls}
                              placeholder={t("contactPage.firstNamePlaceholder")}
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
                          <FormLabel className={labelCls}>{t("contactPage.lastName")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="family-name"
                              className={fieldCls}
                              placeholder={t("contactPage.lastNamePlaceholder")}
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
                        <FormLabel className={labelCls}>{t("contactPage.emailLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            autoComplete="email"
                            className={fieldCls}
                            placeholder={t("contactPage.emailPlaceholder")}
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
                        <FormLabel className={labelCls}>{t("contactPage.messageLabel")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={6}
                            className={cn(fieldCls, "h-auto resize-none py-3")}
                            placeholder={t("contactPage.messagePlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      className="h-12 rounded-full bg-primary px-7 text-small font-medium text-primary-foreground transition-colors hover:bg-primary/85 active:scale-[0.98] disabled:opacity-60"
                    >
                      {t("contactPage.sendButton")}
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </AnimateInView>

          <div className="flex flex-col gap-4 lg:col-span-5">
            {info.map((item, i) => (
              <AnimateInView
                key={item.title}
                delay={0.08 * (i + 1)}
                className={cn("flex-1 rounded-[1.75rem] p-6 md:p-8", item.tone)}
              >
                <div className="flex items-center gap-2 text-small text-foreground/70">
                  <item.icon size={16} strokeWidth={1.5} />
                  {item.title}
                </div>
                <h2 className="mt-3 text-h4 font-medium">{item.subtitle}</h2>
                <ul className="mt-4 space-y-1 text-body">
                  {item.values.map((val) => (
                    <li key={val.text}>
                      {"href" in val ? (
                        <a href={val.href} className="underline-offset-4 hover:underline">
                          {val.text}
                        </a>
                      ) : (
                        val.text
                      )}
                    </li>
                  ))}
                </ul>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
