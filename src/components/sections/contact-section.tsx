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

const inputClass =
  "w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-white/25 focus:outline-none focus:border-maiyu-amber focus:bg-white/[0.06] transition-all duration-200 font-body";

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
    <section id="contact" className="py-28 px-6" style={{ backgroundColor: "#0d2318" }}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* Form column */}
          <AnimateInView>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-6 h-px bg-maiyu-amber inline-block" />
              <p className="text-maiyu-amber font-body text-[10px] font-medium tracking-[0.3em] uppercase">
                {t("contact.label")}
              </p>
            </div>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-10 text-foreground">
              {t("contact.heading")}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register("name")}
                  placeholder={t("contact.name")}
                  className={inputClass}
                  style={{ borderRadius: "1px" }}
                />
                {errors.name && (
                  <p className="text-red-400 font-body text-xs mt-1.5">
                    {t("contact.required")}
                  </p>
                )}
              </div>

              <div>
                <input
                  {...register("email")}
                  type="email"
                  placeholder={t("contact.email")}
                  className={inputClass}
                  style={{ borderRadius: "1px" }}
                />
                {errors.email && (
                  <p className="text-red-400 font-body text-xs mt-1.5">
                    {t("contact.invalidEmail")}
                  </p>
                )}
              </div>

              <div>
                <input
                  {...register("company")}
                  placeholder={t("contact.company")}
                  className={inputClass}
                  style={{ borderRadius: "1px" }}
                />
              </div>

              <div>
                <textarea
                  {...register("message")}
                  rows={5}
                  placeholder={t("contact.message")}
                  className={`${inputClass} resize-none`}
                  style={{ borderRadius: "1px" }}
                />
                {errors.message && (
                  <p className="text-red-400 font-body text-xs mt-1.5">
                    {t("contact.required")}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3.5 px-8 bg-maiyu-amber text-maiyu-dark font-body text-sm font-bold tracking-wider uppercase transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
                style={{ borderRadius: "1px" }}
              >
                {isSubmitting ? "..." : t("contact.send")}
              </button>
            </form>
          </AnimateInView>

          {/* Info column */}
          <AnimateInView delay={0.2}>
            <div className="space-y-8 lg:pt-20">
              {[
                {
                  icon: MapPin,
                  label: t("contact.address"),
                  lines: [
                    "Rua Gildo Sampaio, 140, CM Filadelfia",
                    "Benjamin Constant, Amazonas, Brasil",
                  ],
                },
                {
                  icon: Mail,
                  label: t("contact.emailUs"),
                  lines: ["contato@maiyu.com", "suporte@maiyu.com"],
                },
                {
                  icon: Phone,
                  label: t("contact.phone"),
                  lines: ["+55 (97) 9 8431-7149", "+55 (92) 9 8633-1746"],
                },
              ].map(({ icon: Icon, label, lines }) => (
                <div key={label} className="flex items-start gap-4">
                  <div
                    className="p-2.5 border border-white/8 shrink-0"
                    style={{ borderRadius: "1px" }}
                  >
                    <Icon size={16} className="text-maiyu-amber" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground mb-1.5">
                      {label}
                    </h3>
                    {lines.map((line, i) => (
                      <p key={i} className="text-white/40 font-body text-xs leading-[1.8]">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AnimateInView>
        </div>
      </div>
    </section>
  );
}
