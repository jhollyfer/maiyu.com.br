import { useLanguage } from "@/contexts/language";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(10),
});

type ContactForm = z.infer<typeof contactSchema>;

export function ContactSection() {
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (_data: ContactForm) => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success(t("contact.success"));
    reset();
  };

  return (
    <section id="contact" className="py-24 px-6 bg-maiyu-dark">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <AnimateInView>
            <p className="text-maiyu-green text-sm font-medium tracking-widest uppercase mb-3">
              {t("contact.label")}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-10">
              {t("contact.heading")}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <input
                  {...register("name")}
                  placeholder={t("contact.name")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-maiyu-purple transition-colors"
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">{t("contact.required")}</p>
                )}
              </div>

              <div>
                <input
                  {...register("email")}
                  type="email"
                  placeholder={t("contact.email")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-maiyu-purple transition-colors"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{t("contact.invalidEmail")}</p>
                )}
              </div>

              <div>
                <input
                  {...register("company")}
                  placeholder={t("contact.company")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-maiyu-purple transition-colors"
                />
              </div>

              <div>
                <textarea
                  {...register("message")}
                  rows={5}
                  placeholder={t("contact.message")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-maiyu-purple transition-colors resize-none"
                />
                {errors.message && (
                  <p className="text-red-400 text-xs mt-1">{t("contact.required")}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-8 rounded-full bg-gradient-to-r from-maiyu-purple to-maiyu-blue text-white font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? "..." : t("contact.send")}
              </button>
            </form>
          </AnimateInView>

          <AnimateInView delay={0.2}>
            <div className="space-y-8 lg:pt-16">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <MapPin size={20} className="text-maiyu-green" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t("contact.address")}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Rua Gildo Sampaio, 140, CM Filadelfia
                    <br />
                    Benjamin Constant, Amazonas, Brasil
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <Mail size={20} className="text-maiyu-green" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t("contact.emailUs")}</h3>
                  <p className="text-white/50 text-sm">
                    contato@maiyu.com
                    <br />
                    suporte@maiyu.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <Phone size={20} className="text-maiyu-green" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t("contact.phone")}</h3>
                  <p className="text-white/50 text-sm">
                    +55 (97) 9 8431-7149
                    <br />
                    +55 (92) 9 8633-1746
                  </p>
                </div>
              </div>
            </div>
          </AnimateInView>
        </div>
      </div>
    </section>
  );
}
