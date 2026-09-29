import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
import { PageHero } from "@/components/page-hero";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language";
import { articles, categories, featuredArticle, type Category } from "@/data/articles";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

const TINTS = ["bg-tint-mint", "bg-tint-peach", "bg-tint-mist"];

const Blog = () => {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const recent = articles.filter((a) => a.slug !== featuredArticle.slug);
  const filtered =
    activeCategory === "all" ? recent : recent.filter((a) => a.category === activeCategory);

  return (
    <>
      <PageHero title={t("blog.title")} lead={t("blog.description")} />

      {/* Featured article */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <AnimateInView>
            <Link
              to={`/blog/${featuredArticle.slug}`}
              className="group grid grid-cols-1 overflow-hidden rounded-[1.75rem] bg-tint-lime md:grid-cols-12"
            >
              <div className="relative aspect-[4/3] overflow-hidden md:col-span-7 md:aspect-auto md:min-h-[480px]">
                <img
                  src={featuredArticle.image}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-col justify-between gap-10 p-6 md:col-span-5 md:p-10">
                <div>
                  <p className="text-small text-foreground/65">
                    {t("blog.featured")}, {t(`blog.category.${featuredArticle.category}`)}
                  </p>
                  <h2 className="mt-3 text-h2">{featuredArticle.title[language]}</h2>
                  <p className="mt-5 font-serif text-lead leading-snug text-foreground/85">
                    {featuredArticle.excerpt[language]}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={featuredArticle.authorImg}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-small font-medium">{featuredArticle.author}</p>
                    <p className="text-micro text-foreground/70">
                      {featuredArticle.role[language]}, {featuredArticle.readTime[language]}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </AnimateInView>
        </div>
      </section>

      {/* Recent entries with filter */}
      <section className="bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="text-h1">{t("blog.recentArticles")}</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-small font-medium transition-colors duration-300",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/20 text-foreground/70 hover:border-foreground/45 hover:text-foreground",
                    )}
                  >
                    {t(`blog.category.${cat}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <StaggerContainer
            key={activeCategory}
            className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((article, idx) => (
              <motion.div key={article.slug} variants={staggerItemVariants}>
                <Link to={`/blog/${article.slug}`} className="group block">
                  <div className={cn("overflow-hidden rounded-[1.5rem]", TINTS[idx % 3])}>
                    <img
                      src={article.image}
                      alt=""
                      width={640}
                      height={440}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/11] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-5 text-small text-muted-foreground">
                    {t(`blog.category.${article.category}`)}, {article.readTime[language]}
                  </p>
                  <h3 className="mt-2 text-h4 font-medium transition-opacity group-hover:opacity-75">
                    {article.title[language]}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-body text-foreground/70">
                    {article.excerpt[language]}
                  </p>
                </Link>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 md:py-32">
        <AnimateInView className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col items-center rounded-[1.75rem] bg-tint-mist px-6 py-16 text-center md:py-20">
            <h2 className="text-h1">{t("blog.newsletterTitle")}</h2>
            <p className="mt-5 max-w-[44ch] font-serif text-lead text-foreground/80">
              {t("blog.newsletterDesc")}
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email
              </label>
              <Input
                id="newsletter-email"
                type="email"
                required
                placeholder={t("blog.emailPlaceholder")}
                className="h-12 flex-1 rounded-full border-foreground/25 bg-background/70 px-5 text-body placeholder:text-foreground/55"
              />
              <button
                type="submit"
                className="h-12 rounded-full bg-primary px-6 text-small font-medium text-primary-foreground transition-colors hover:bg-primary/85 active:scale-[0.98]"
              >
                {t("blog.subscribe")}
              </button>
            </form>
          </div>
        </AnimateInView>
      </section>
    </>
  );
};

export default Blog;
