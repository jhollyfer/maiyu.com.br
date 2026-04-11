import { useLanguage } from "@/contexts/language";
import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
import { Input } from "@/components/ui/input";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { articles, categories, featuredArticle, type Category } from "@/data/articles";
import { cn } from "@/lib/utils";

const Blog = () => {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const recent = articles.filter((a) => a.slug !== featuredArticle.slug);
  const filtered =
    activeCategory === "all"
      ? recent
      : recent.filter((a) => a.category === activeCategory);

  return (
    <div className="bg-background min-h-screen">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-paper pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-12 gap-8">
          <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-4">
            <p className="eyebrow">— {t("blog.eyebrow")}</p>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.1}
            className="col-span-12 md:col-span-8"
          >
            <h1 className="font-display text-display font-400 leading-[0.95] tracking-[-0.035em] text-foreground max-w-4xl">
              {t("blog.title")}
            </h1>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.2}
            className="col-span-12 md:col-span-6 md:col-start-7 mt-10"
          >
            <p className="font-sans text-body-lg text-foreground/75 leading-[1.65] max-w-xl">
              {t("blog.description")}
            </p>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Featured article — full-bleed magazine cover ─────── */}
      <section className="pt-12 md:pt-16 pb-24 md:pb-32 bg-canvas-sand dark:bg-canvas-shale">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <AnimateInView variant="fadeUp">
            <Link
              to={`/blog/${featuredArticle.slug}`}
              className="group block"
            >
              {(() => {
                const featuredMeta = (
                  <div className="max-w-3xl">
                    <p className="font-mono text-micro text-foreground/70 mb-4 tabular-nums uppercase tracking-[0.15em]">
                      {featuredArticle.date} · {t(`blog.category.${featuredArticle.category}`)}
                    </p>
                    <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-foreground">
                      {featuredArticle.title[language]}
                    </h2>
                    <p className="font-sans text-body text-foreground/75 mt-4 max-w-xl">
                      {featuredArticle.excerpt[language]}
                    </p>
                    <div className="flex items-center gap-3 mt-8">
                      <img
                        src={featuredArticle.authorImg}
                        alt={featuredArticle.author}
                        className="size-10 rounded-full ring-1 ring-foreground/10 object-cover"
                      />
                      <div>
                        <p className="font-sans text-small font-medium text-foreground">
                          {featuredArticle.author}
                        </p>
                        <p className="font-sans text-micro text-muted-foreground">
                          {featuredArticle.role[language]} ·{" "}
                          {featuredArticle.readTime[language]}
                        </p>
                      </div>
                    </div>
                  </div>
                );
                return (
                  <>
                    <div className="relative overflow-hidden rounded-[2.5rem] aspect-[4/3] md:aspect-[21/10] bg-canvas-sand dark:bg-canvas-moss">
                      <img
                        src={featuredArticle.image}
                        alt={featuredArticle.title[language]}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                      />
                      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />

                      <div className="absolute top-5 md:top-8 left-5 md:left-8">
                        <span className="inline-flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-md px-4 py-1.5 text-[10px] tracking-[0.22em] uppercase font-medium text-foreground">
                          <span className="size-1 rounded-full bg-[color:var(--color-amber)]" />
                          {t("blog.featured")}
                        </span>
                      </div>

                      <div className="hidden md:block absolute bottom-0 left-0 right-0 p-12">
                        {featuredMeta}
                      </div>
                    </div>
                    <div className="md:hidden mt-6 px-1">{featuredMeta}</div>
                  </>
                );
              })()}
            </Link>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Category filter + recent articles ─────────────────── */}
      <section className="pb-24 md:pb-32 bg-canvas-bone dark:bg-canvas-moss border-y border-foreground/[0.06]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 md:pt-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="eyebrow mb-4">— {t("blog.recentArticles")}</p>
              <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-foreground">
                {t("blog.recentArticles")}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-4 py-1.5 text-[10px] font-sans font-medium tracking-[0.18em] uppercase transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "border-foreground/20 text-foreground/70 hover:text-foreground hover:border-foreground/40",
                    )}
                  >
                    {t(`blog.category.${cat}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {filtered.map((article, idx) => (
              <motion.div
                key={article.slug}
                variants={staggerItemVariants}
                className={
                  idx % 3 === 0
                    ? "md:col-span-7"
                    : idx % 3 === 1
                      ? "md:col-span-5 md:mt-20"
                      : "md:col-span-6 md:col-start-4"
                }
              >
                <Link to={`/blog/${article.slug}`} className="group block">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[2rem] bg-canvas-sand dark:bg-canvas-shale",
                      idx % 3 === 1 ? "aspect-[4/5]" : "aspect-[16/10]",
                    )}
                  >
                    <img
                      src={article.image}
                      alt={article.title[language]}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
                    <div className="absolute top-5 left-5">
                      <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-md px-3 py-1 text-[10px] tracking-[0.18em] uppercase font-medium text-foreground">
                        {t(`blog.category.${article.category}`)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="font-mono text-micro text-muted-foreground tabular-nums mb-2 uppercase tracking-[0.12em]">
                      {article.date} · {article.readTime[language]}
                    </p>
                    <h3 className="font-display text-h3 font-400 tracking-[-0.02em] text-foreground group-hover:text-[color:var(--color-forest)] dark:group-hover:text-[color:var(--color-forest-bright)] transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] leading-[1.1]">
                      {article.title[language]}
                    </h3>
                    <p className="font-sans text-body text-foreground/70 mt-3 leading-relaxed line-clamp-2">
                      {article.excerpt[language]}
                    </p>
                    <div className="flex items-center gap-2.5 mt-5">
                      <img
                        src={article.authorImg}
                        alt={article.author}
                        className="size-7 rounded-full object-cover"
                      />
                      <span className="font-sans text-micro text-foreground/70">
                        {article.author}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Newsletter — forest editorial block ───────────────── */}
      <section className="relative py-24 md:py-32 bg-canvas-forest dark:bg-canvas-night text-[color:var(--color-canvas-cream)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(216,138,43,0.1),_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-12 gap-8 items-end">
            <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-4">
              <p className="font-sans text-micro tracking-[0.22em] uppercase font-medium text-[color:var(--color-canvas-cream)]/55">
                — Subscribe
              </p>
            </AnimateInView>
            <AnimateInView
              variant="fadeUp"
              delay={0.1}
              className="col-span-12 md:col-span-8"
            >
              <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-[color:var(--color-canvas-cream)] max-w-2xl">
                {t("blog.newsletterTitle")}
              </h2>
              <p className="font-sans text-body text-[color:var(--color-canvas-cream)]/70 mt-5 max-w-lg leading-relaxed">
                {t("blog.newsletterDesc")}
              </p>

              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-10 flex items-center gap-2 max-w-md border-b border-[color:var(--color-canvas-cream)]/25 pb-2 focus-within:border-[color:var(--color-amber)] transition-colors duration-[480ms]"
              >
                <Input
                  type="email"
                  placeholder={t("blog.emailPlaceholder")}
                  className="flex-1 bg-transparent border-0 rounded-none px-0 h-10 font-sans text-body text-[color:var(--color-canvas-cream)] placeholder:text-[color:var(--color-canvas-cream)]/40 focus-visible:ring-0"
                />
                <button
                  type="submit"
                  className="group inline-flex items-center gap-1.5 font-sans text-[12px] font-medium tracking-[0.12em] uppercase text-[color:var(--color-canvas-cream)] hover:text-[color:var(--color-amber)] transition-colors duration-[480ms]"
                >
                  {t("blog.subscribe")}
                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.6}
                    className="transition-transform duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </button>
              </form>
            </AnimateInView>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
