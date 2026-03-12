import { useLanguage } from "@/contexts/language";
import { AnimateInView, StaggerContainer, staggerItemVariants } from "@/components/motion/animate-in-view";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const categories = ["all", "tech", "design", "marketing"] as const;
type Category = (typeof categories)[number];

const articles = [
  {
    slug: "dark-mode-web-applications",
    title: "The Evolution of Dark Mode in Modern Web Applications",
    excerpt: "A deep dive into the psychological benefits and technical challenges of implementing dark themes for global audiences.",
    category: "marketing" as Category,
    author: "Mark Thompson",
    date: "Feb 12",
    readTime: "4 min read",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPqAMqRN1xEbhy3KniUJbJOg39ifkLg5-726tnlH0u9zmXfOn8zTmRqAt56WHRTyxf5exYJfMjltUdlhaYnZG9GyHM68wjfNfxvGo1B8m-K_oHqpRkk45IOQP_F1JDB8LfdoW9dYiOw-9jVq49gwJ88jagynR9lEF_BrU-L5WePy49VRCGULRXZQtafZgeqp4U-91iqwqYjbZYkJTPMjz5S9jr3bm5gJ0MI6D7jjQrgcwE9k6sPNtFiyjz_fBFhLbyhw5WkVA2p34",
    authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDc4Htsi6R1hmJ6l-Bre8JhuP8_ljraYi-WrqqShDl6YY6axtIH1Xk9JRIk2Ud_nUzxF0Ze5yCi2SEkAmGfuaxCWxfZDm6iu9WvbMN99DqY9YTblnBJSc0-oBJeh6H81YkpAZCyHucw5bXx_DjwGtEnCqmSdr9UtZQNY7Ea-C-RS-btchvpcE0N_xNCsIa1NJY19yCIfPa7TxdSHG5P1oz-HaIaK01TtiuA0Yu3WnReABWhq9iEhcHhi30Swq39XM0wUEfSopWZ-J8",
  },
  {
    slug: "high-conversion-landing-pages",
    title: "10 Principles of High-Conversion Landing Pages",
    excerpt: "Learn how the world's most successful tech companies structure their top-of-funnel experiences for maximum impact.",
    category: "design" as Category,
    author: "Elena Rodriguez",
    date: "Feb 08",
    readTime: "12 min read",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8BvwvLMJVSma-8MlmspW2hKcyQBEL64MK17frR-lhy57g5evEtbQ91UdEneCVIsKLwIRNk4nv3nuZGppav7DxE2gXGsVyRULW4bj9ER4Bcz0uRur6sfdmnv5WN5z7OsaIvK2nsnyY5pCoc65ROqQg51lhji4otOxnHY7Yqon_U2d9r38ZRQfJpMtFHDLRSFlr7yJzR13S7MpJoTc6FYepjp0HcW5e_PMsHRFMVXM3YXS09mf7DZ_bLTzMN2h3nmH3UNjKQHJ---o",
    authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhLpj1OXKAICPN8UKjFtBAruoJUQ3BGy9lUiM23vayw16wMPjjpEKJ6gT_isKyQpo6DllAQBoyA4_1bZJFTY9P40NdYyRSRLTxnRHQ5wjDe0e_FYe9W_llYIszAglpoykcKyRNTV0nynqjGLmCQ0kRu6sFoTFlGezWtTgsOv3DYLgU7AwTDuISjm65jsRu2mNg2qralJL_IyH5bMOtti_3AE2dW_2KoyrJbYzB7FYDiSTpO5B04ybpf3gCrBU9Cw9hsBR4F8CWBPY",
  },
  {
    slug: "micro-interactions-user-loyalty",
    title: "Micro-Interactions: The Secret to User Loyalty",
    excerpt: "Small details make the difference. Discover how subtle animations can drastically improve user retention and brand affinity.",
    category: "tech" as Category,
    author: "James Wilson",
    date: "Jan 30",
    readTime: "6 min read",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCojBiZ6ClfedLLQe0K1SaZsl21GNz2FEAbS_EKXBFND_g4gB3fzD0O1zQ3ibRqjpEtMZEMy-nTueHqVkkHlEZQwzFDjhQgtyJCyzdGbz111dSQLjQzEVyxAm1JwW_js6h79EAY6WH6_iOoWbZnqUM4nsrFsqnPbOGHFW7K35LHrGJfHtaGVP6JhS-xoXq85_MJm9t0G0f3-FT6TfOVm27M72ozq3Ulc__3lLHi0dc33dsUscmXrZ8AwVkdot-TAAMDgieN5J69tJk",
    authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOCmjCIwUiZlphcf3jqXj83hVAeKQQ5_2uGKHLo-_Lq7GA-2CzzIc60eeK_8SlK7WRkMbUg0sD7JatmRvZs22-IV4oewwCwD31SvHGQmPydCGNEGZ_fT42JWQFvwE8X6_M9bB_8TfHbHhwLW1--ML3oznAf83t1hnyWgrsKa6fZBKUQWMbJiObXrsb0D5VTozPgyBmUkocHLKVXF2NhohX13ivknjmwd5JivDNtglgdIJB7qYMpXwPCYOjmJcA_gpnR-_Tv-zNBPg",
  },
];

const featuredArticle = {
  slug: "future-digital-design",
  title: "Exploring the Future of Digital Design and Innovation",
  author: "Sarah Jenkins",
  role: "Senior Design Lead",
  readTime: "5 min read",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuChAIb-bVeygz_--3Dp3D-p61O4uz4HiRggsPbbqVJRMPzagnn-Aucnk_YAzYryUFxAsS-XmAie2drRCH2SBEzkO5O7yEjfQfENcGOWnc6k9KW0RAqG5ZHDbUQxjhQB0NuEYWx6MPvMR-EstKRErOzQY5HxlexX9A4CdxgzgebOaMk-RwMlLcYdHq4vo2X0J2Ale22j0jdjJawD_ZTToiSiUd5x6osrdXPmyfOOqud8OrdHcqRg6fPtMfabadWBYPQq4o21WhLymAY",
  authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxfSwKe_Nu3dY3jNDtpq5SjOZM9n77ynyexZaD9Qlb4KO0UGzskiUAyR4l4eYkbPzhkE9O3TAk8OrQrJ_c8xMtMvYJI7kTyIrLEwhqSsghRF5MYN3jrmmLh91iThH6vGbj4gOSvkEEvAUVcrT8TH5oBK2VbR3VjwX-t6nsdAhCxZjbEJzfuhD5-u7gsTLLI9CeB75qRL_t4q4bBq5HEoyoLeLMjONH7SscqM9NWbXWLl_Hm6QN9GDpRrJh9lUG1yQclB8-4SySzjc",
};

const secondaryFeatured = {
  slug: "next-gen-tech-marketing",
  title: "How Maiyu is Shaping the Next Generation of Tech Marketing",
  excerpt: "Discover the intersection of creativity and data-driven strategies in our latest deep dive into performance aesthetics.",
  category: "Case Study",
  readTime: "8 min read",
  date: "Jan 24, 2024",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDB0i68V69E2e0FkNjQO-mAM00Ueh__kkm7Peh5Uin5452L5hFyHbP-7Lvkvb1pKLjW3c5uFCKlY22UTmV-XlkKc_XE6xndApFLuia-QPC_i5De0hBi4M3evEuTQad-F1CcJ08CEPjvbBT1F84z5_oR-cnBw0ucgghP6uQj0eVlHlN0YaeSa_-HqlDBJk5okIQVkkVPLyciVfz2lzI3FCDK5ZqI2Q7JkJIZIC57XjoLCdyCN8zi7EaPvAgZF1lC4umXzJ0DbnLtt6c",
};

const Blog = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filteredArticles = activeCategory === "all"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  return (
    <div className="bg-background min-h-screen">
      {/* Featured Hero Article */}
      <section className="max-w-7xl mx-auto px-6 pt-28 pb-8">
        <AnimateInView variant="fadeUp">
          <Link to={`/blog/${featuredArticle.slug}`}>
            <div className="group relative overflow-hidden rounded-3xl bg-card min-h-[450px] flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--background) 90%, transparent) 100%), url("${featuredArticle.image}")`,
                }}
              />
              <div className="relative p-8 md:p-12 max-w-3xl">
                <Badge className="bg-maiyu-purple text-white mb-4">{t("blog.featured")}</Badge>
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-white mb-6">
                  {featuredArticle.title}
                </h1>
                <div className="flex items-center gap-4 text-white/60">
                  <img
                    alt={featuredArticle.author}
                    className="h-10 w-10 rounded-full border-2 border-maiyu-purple object-cover"
                    src={featuredArticle.authorImg}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{featuredArticle.author}</p>
                    <p className="text-xs">{featuredArticle.role} &bull; {featuredArticle.readTime}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </AnimateInView>
      </section>

      {/* Category Filter Bar */}
      <section className="max-w-7xl mx-auto px-6 mb-10">
        <AnimateInView variant="fadeUp">
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((cat) => (
              <Button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                variant={activeCategory === cat ? "default" : "outline"}
                className={
                  activeCategory === cat
                    ? "bg-maiyu-purple text-white rounded-xl"
                    : "bg-card text-muted-foreground border-border rounded-xl hover:bg-muted"
                }
              >
                {t(`blog.category.${cat}`)}
              </Button>
            ))}
          </div>
        </AnimateInView>
      </section>

      {/* Secondary Featured Article */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <AnimateInView variant="fadeUp">
          <Link to={`/blog/${secondaryFeatured.slug}`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-2xl bg-card shadow-2xl">
              <div className="lg:col-span-7 h-64 lg:h-auto overflow-hidden">
                <img
                  className="h-full w-full object-cover"
                  src={secondaryFeatured.image}
                  alt={secondaryFeatured.title}
                />
              </div>
              <div className="lg:col-span-5 flex flex-col justify-center p-8 md:p-12">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-maiyu-purple">
                  {secondaryFeatured.category}
                </p>
                <h2 className="mb-4 text-2xl font-bold leading-tight text-foreground">
                  {secondaryFeatured.title}
                </h2>
                <p className="mb-6 text-muted-foreground">
                  {secondaryFeatured.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {secondaryFeatured.readTime} &bull; {secondaryFeatured.date}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold text-maiyu-purple hover:text-foreground transition-colors">
                    {t("blog.readStory")}
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </AnimateInView>
      </section>

      {/* Recent Articles Grid */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-foreground">{t("blog.recentArticles")}</h3>
        </div>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <motion.div key={article.slug} variants={staggerItemVariants}>
              <Link to={`/blog/${article.slug}`}>
                <Card className="flex flex-col rounded-2xl bg-card border-border overflow-hidden group h-full cursor-pointer">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={article.image}
                      alt={article.title}
                    />
                    <Badge className="absolute top-4 left-4 bg-background/80 text-foreground backdrop-blur-md text-[10px] uppercase">
                      {article.category}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-6">
                    <h4 className="mb-3 text-lg font-bold leading-snug text-foreground group-hover:text-maiyu-purple transition-colors">
                      {article.title}
                    </h4>
                    <p className="mb-6 text-sm text-muted-foreground line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="mt-auto flex items-center gap-3">
                      <img
                        className="h-8 w-8 rounded-full border border-maiyu-purple/30 object-cover"
                        src={article.authorImg}
                        alt={article.author}
                      />
                      <div className="text-[11px]">
                        <p className="font-bold text-foreground">{article.author}</p>
                        <p className="text-muted-foreground">
                          {article.date} &bull; {article.readTime}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </StaggerContainer>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <AnimateInView variant="fadeUp">
          <div className="rounded-3xl bg-maiyu-purple p-8 md:p-16 text-center">
            <h2 className="text-3xl font-extrabold mb-4 text-maiyu-black">{t("blog.newsletterTitle")}</h2>
            <p className="mb-8 max-w-lg mx-auto text-maiyu-black/80">
              {t("blog.newsletterDesc")}
            </p>
            <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3" onSubmit={(e) => e.preventDefault()}>
              <Input
                className="flex-1 rounded-xl border-none px-6 py-4 text-maiyu-black bg-white focus:ring-2 focus:ring-maiyu-black"
                placeholder={t("blog.emailPlaceholder")}
                type="email"
              />
              <Button className="bg-foreground text-background px-8 py-4 rounded-xl font-bold hover:bg-foreground/90 transition-colors">
                {t("blog.subscribe")}
              </Button>
            </form>
          </div>
        </AnimateInView>
      </section>
    </div>
  );
};

export default Blog;
