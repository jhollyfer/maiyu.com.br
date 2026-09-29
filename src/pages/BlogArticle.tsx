import { CtaLink } from "@/components/cta-link";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { SkyBackdrop } from "@/components/sky";
import { useLanguage } from "@/contexts/language";
import { getArticleBySlug } from "@/data/articles";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <section className="relative flex min-h-[80dvh] items-center justify-center overflow-hidden px-4 pt-32">
        <SkyBackdrop />
        <div className="relative max-w-md text-center">
          <span className="pill mb-6">404</span>
          <h1 className="mb-8 text-h1">{t("blogArticle.notFound")}</h1>
          <CtaLink to="/blog" variant="ghost">
            <ArrowLeft size={15} strokeWidth={1.75} />
            {t("blogArticle.returnToJournal")}
          </CtaLink>
        </div>
      </section>
    );
  }

  const h2 = "mt-16 mb-5 text-h2";
  const para = "mb-8 text-body-lg leading-[1.75] text-foreground/85";

  return (
    <>
      <header className="relative overflow-hidden pt-32 pb-16 md:pt-40">
        <SkyBackdrop />
        <div className="relative mx-auto max-w-3xl px-4 md:px-8">
          <AnimateInView>
            <Link
              to="/blog"
              className="group inline-flex items-center gap-2 text-small text-foreground/70 transition-colors hover:text-foreground"
            >
              <ArrowLeft
                size={14}
                strokeWidth={1.75}
                className="transition-transform duration-300 group-hover:-translate-x-0.5"
              />
              {t("blogArticle.backToJournal")}
            </Link>
            <p className="mt-10 text-small text-foreground/70">
              {t(`blog.category.${article.category}`)}, {article.date}
            </p>
            <h1 className="mt-4 text-h1 md:text-display">{article.title[language]}</h1>
            <p className="mt-8 font-serif text-lead leading-snug text-foreground/80">
              {article.excerpt[language]}
            </p>
            <div className="mt-10 flex items-center gap-4">
              <img src={article.authorImg} alt="" className="size-11 rounded-full object-cover" />
              <div>
                <p className="text-body font-medium">{article.author}</p>
                <p className="text-small text-foreground/70">
                  {article.role[language]}, {article.readTime[language]}
                </p>
              </div>
            </div>
          </AnimateInView>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <AnimateInView variant="scaleIn" duration={1.1}>
          <div className="overflow-hidden rounded-[1.75rem] bg-tint-mist">
            <img
              src={article.image}
              alt=""
              className="aspect-[16/9] w-full object-cover md:aspect-[21/10]"
            />
          </div>
        </AnimateInView>
      </div>

      <article className="mx-auto max-w-2xl px-4 py-20 md:px-8 md:py-28">
        <p className={para}>{t("blogArticle.introText")}</p>

        <h2 className={h2}>{t("blogArticle.section1Title")}</h2>
        <p className={para}>{t("blogArticle.section1Text")}</p>
        <ul className="mb-12 list-disc space-y-3 pl-5 text-body text-foreground/85 marker:text-foreground/40">
          {["blogArticle.bullet1", "blogArticle.bullet2", "blogArticle.bullet3"].map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>

        <h2 className={h2}>{t("blogArticle.section2Title")}</h2>
        <p className={para}>{t("blogArticle.section2Text")}</p>

        <blockquote className="my-16 rounded-[1.5rem] bg-tint-peach p-8 md:p-10">
          <p className="font-serif text-h3 italic leading-snug">“{t("blogArticle.quote")}”</p>
        </blockquote>

        <h2 className={h2}>{t("blogArticle.section3Title")}</h2>
        <p className={para}>{t("blogArticle.section3Text")}</p>
      </article>

      <section className="pb-24 md:pb-32">
        <AnimateInView className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="flex flex-col items-start gap-8 rounded-[1.75rem] bg-tint-mint p-8 md:flex-row md:items-end md:justify-between md:p-14">
            <div>
              <h2 className="text-h1">{t("blogArticle.ctaTitle")}</h2>
              <p className="mt-4 max-w-[40ch] font-serif text-lead text-foreground/80">
                {t("blogArticle.ctaDescription")}
              </p>
            </div>
            <CtaLink to="/contact" arrow>
              {t("nav.getInTouch")}
            </CtaLink>
          </div>
        </AnimateInView>
      </section>
    </>
  );
};

export default BlogArticle;
