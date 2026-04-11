import { useLanguage } from "@/contexts/language";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { getArticleBySlug } from "@/data/articles";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-32 px-6">
        <div className="text-center max-w-md">
          <p className="font-mono text-micro text-muted-foreground mb-4 tracking-[0.2em] uppercase">
            404
          </p>
          <h1 className="font-display text-h1 font-400 tracking-[-0.025em] text-foreground mb-6">
            {t("blogArticle.notFound")}
          </h1>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-sans text-body text-[color:var(--color-forest)] dark:text-[color:var(--color-forest-bright)] hover:opacity-80"
          >
            <ArrowLeft size={14} strokeWidth={1.4} />
            {t("blogArticle.returnToJournal")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ─── Header ───────────────────────────────────────────── */}
      <section className="relative pt-32 md:pt-40 pb-12 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-paper pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 md:px-10">
          <AnimateInView variant="fadeUp">
            <Link
              to="/blog"
              className="group inline-flex items-center gap-2 eyebrow hover:text-foreground transition-colors duration-[480ms]"
            >
              <ArrowLeft
                size={12}
                strokeWidth={1.6}
                className="transition-transform duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-0.5"
              />
              {t("blogArticle.backToJournal")}
            </Link>
          </AnimateInView>

          <AnimateInView variant="fadeUp" delay={0.08} className="mt-8">
            <p className="eyebrow mb-6">
              — {t(`blog.category.${article.category}`)} · {article.date}
            </p>
          </AnimateInView>

          <AnimateInView variant="fadeUp" delay={0.12}>
            <h1 className="font-display text-h1 md:text-display font-400 leading-[0.98] tracking-[-0.028em] text-foreground max-w-3xl">
              {article.title[language]}
            </h1>
          </AnimateInView>

          <AnimateInView variant="fadeUp" delay={0.2} className="mt-10">
            <p className="font-sans text-body-lg text-foreground/75 leading-[1.65] max-w-2xl">
              {article.excerpt[language]}
            </p>
          </AnimateInView>

          <AnimateInView
            variant="fadeUp"
            delay={0.25}
            className="mt-12 pt-8 flex items-center gap-4 border-t border-foreground/[0.08]"
          >
            <img
              src={article.authorImg}
              alt={article.author}
              className="size-12 rounded-full ring-1 ring-foreground/10 object-cover"
            />
            <div className="flex-1">
              <p className="font-sans text-body font-medium text-foreground">
                {article.author}
              </p>
              <p className="font-sans text-small text-muted-foreground">
                {article.role[language]} · {article.readTime[language]}
              </p>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Hero image ────────────────────────────────────────── */}
      <section className="pt-8 md:pt-12 pb-20 md:pb-28 bg-canvas-sand dark:bg-canvas-shale">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <AnimateInView variant="scaleIn" duration={1.2}>
            <div className="bezel-shell">
              <div className="bezel-core relative overflow-hidden aspect-[16/9] md:aspect-[21/10]">
                <img
                  src={article.image}
                  alt={article.title[language]}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Body — long form with drop initial + pull quote ──── */}
      <article className="pb-24 md:pb-32">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <AnimateInView variant="fadeUp">
            <p className="drop-initial font-sans text-body-lg text-foreground/85 leading-[1.75] mb-10">
              {t("blogArticle.introText")}
            </p>

            <h2 className="font-display text-h2 font-400 tracking-[-0.025em] text-foreground mt-16 mb-6">
              {t("blogArticle.section1Title")}
            </h2>
            <p className="font-sans text-body-lg text-foreground/80 leading-[1.75] mb-8">
              {t("blogArticle.section1Text")}
            </p>

            <ul className="space-y-4 mb-12 pl-0 list-none">
              {[
                "blogArticle.bullet1",
                "blogArticle.bullet2",
                "blogArticle.bullet3",
              ].map((key, i) => (
                <li
                  key={key}
                  className="flex items-start gap-4 font-sans text-body text-foreground/80 leading-relaxed"
                >
                  <span className="font-mono text-micro text-muted-foreground tabular-nums mt-1.5 shrink-0">
                    0{i + 1}
                  </span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>

            <h2 className="font-display text-h2 font-400 tracking-[-0.025em] text-foreground mt-16 mb-6">
              {t("blogArticle.section2Title")}
            </h2>
            <p className="font-sans text-body-lg text-foreground/80 leading-[1.75] mb-10">
              {t("blogArticle.section2Text")}
            </p>

            {/* Pull quote — editorial */}
            <blockquote className="my-16 relative">
              <span
                className="absolute -top-6 -left-2 font-display text-[8rem] leading-none text-[color:var(--color-forest)]/15 dark:text-[color:var(--color-forest-bright)]/20 pointer-events-none select-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <p className="relative font-display text-h2 font-400 italic leading-[1.15] tracking-[-0.015em] text-foreground pl-6 border-l-2 border-[color:var(--color-amber)]">
                {t("blogArticle.quote")}
              </p>
            </blockquote>

            <h2 className="font-display text-h2 font-400 tracking-[-0.025em] text-foreground mt-16 mb-6">
              {t("blogArticle.section3Title")}
            </h2>
            <p className="font-sans text-body-lg text-foreground/80 leading-[1.75] mb-10">
              {t("blogArticle.section3Text")}
            </p>
          </AnimateInView>
        </div>
      </article>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="pb-32 md:pb-40">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <AnimateInView variant="fadeUp">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-canvas-forest dark:bg-canvas-night p-10 md:p-16">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(216,138,43,0.15),_transparent_60%)] pointer-events-none" />

              <div className="relative grid grid-cols-12 gap-6 items-end">
                <div className="col-span-12 md:col-span-8">
                  <p className="font-sans text-micro tracking-[0.22em] uppercase font-medium text-[color:var(--color-canvas-cream)]/60 mb-4">
                    — {t("blogArticle.ctaDescription")}
                  </p>
                  <h3 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-[color:var(--color-canvas-cream)]">
                    {t("blogArticle.ctaTitle")}
                  </h3>
                </div>
                <div className="col-span-12 md:col-span-4 flex flex-wrap gap-3 md:justify-end">
                  <Link
                    to="/contact"
                    className="group inline-flex items-center gap-1 pl-6 pr-1 py-1 rounded-full bg-[color:var(--color-amber)] text-[color:var(--color-canvas-night)] font-sans text-[13px] font-medium tracking-[0.02em] transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color:var(--color-amber-warm)] active:scale-[0.97]"
                  >
                    <span className="py-2">{t("blogArticle.ctaButton1")}</span>
                    <span className="ml-2 flex size-8 items-center justify-center rounded-full bg-[color:var(--color-canvas-night)]/15 group-hover:bg-[color:var(--color-canvas-night)]/25 transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight size={13} strokeWidth={1.6} />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </AnimateInView>
        </div>
      </section>
    </div>
  );
};

export default BlogArticle;
