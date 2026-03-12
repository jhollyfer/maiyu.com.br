import { useLanguage } from "@/contexts/language";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowRight, Rocket } from "lucide-react";
import { useParams, Link } from "react-router-dom";

const mockArticles: Record<string, {
  title: string;
  subtitle: string;
  author: string;
  role: string;
  date: string;
  readTime: string;
  authorImg: string;
  heroImg: string;
  category: string;
}> = {
  "dark-mode-web-applications": {
    title: "The Evolution of Dark Mode in Modern Web Applications",
    subtitle: "A deep dive into the psychological benefits and technical challenges of implementing dark themes.",
    author: "Mark Thompson",
    role: "Lead Developer",
    date: "Feb 12, 2024",
    readTime: "4 min read",
    category: "Marketing",
    authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDc4Htsi6R1hmJ6l-Bre8JhuP8_ljraYi-WrqqShDl6YY6axtIH1Xk9JRIk2Ud_nUzxF0Ze5yCi2SEkAmGfuaxCWxfZDm6iu9WvbMN99DqY9YTblnBJSc0-oBJeh6H81YkpAZCyHucw5bXx_DjwGtEnCqmSdr9UtZQNY7Ea-C-RS-btchvpcE0N_xNCsIa1NJY19yCIfPa7TxdSHG5P1oz-HaIaK01TtiuA0Yu3WnReABWhq9iEhcHhi30Swq39XM0wUEfSopWZ-J8",
    heroImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPqAMqRN1xEbhy3KniUJbJOg39ifkLg5-726tnlH0u9zmXfOn8zTmRqAt56WHRTyxf5exYJfMjltUdlhaYnZG9GyHM68wjfNfxvGo1B8m-K_oHqpRkk45IOQP_F1JDB8LfdoW9dYiOw-9jVq49gwJ88jagynR9lEF_BrU-L5WePy49VRCGULRXZQtafZgeqp4U-91iqwqYjbZYkJTPMjz5S9jr3bm5gJ0MI6D7jjQrgcwE9k6sPNtFiyjz_fBFhLbyhw5WkVA2p34",
  },
  "future-digital-design": {
    title: "Exploring the Future of Digital Design and Innovation",
    subtitle: "How emerging technologies are reshaping the creative landscape.",
    author: "Sarah Jenkins",
    role: "Senior Design Lead",
    date: "May 15, 2024",
    readTime: "5 min read",
    category: "Design",
    authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxfSwKe_Nu3dY3jNDtpq5SjOZM9n77ynyexZaD9Qlb4KO0UGzskiUAyR4l4eYkbPzhkE9O3TAk8OrQrJ_c8xMtMvYJI7kTyIrLEwhqSsghRF5MYN3jrmmLh91iThH6vGbj4gOSvkEEvAUVcrT8TH5oBK2VbR3VjwX-t6nsdAhCxZjbEJzfuhD5-u7gsTLLI9CeB75qRL_t4q4bBq5HEoyoLeLMjONH7SscqM9NWbXWLl_Hm6QN9GDpRrJh9lUG1yQclB8-4SySzjc",
    heroImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeL6nkQ-14ePHjiHpKdTc2YQDgfkdUe9tQJgBdDyQoGtSz0hOGZCH5GhEzyTbtCV1cRMjmd7bqfgLB_vGI9d13hqlwi4YaKjSiWEDQv9sAhZx7t7AKxYq1VwIMuK9oPYkBnEw2XfIbtvmaAZoho27VL_m5tep3YZuMCIXPYsib-TZ8R9GyYEg6-knGYRH1qkCCB5e2-uEDeo3REkqVftaDjZv9-8OHt4HT73WaNe8m8j9gOER0LuaT2XS_e_fI6hEiRWKZSQszO-E",
  },
  "high-conversion-landing-pages": {
    title: "10 Principles of High-Conversion Landing Pages",
    subtitle: "Learn how top companies structure their experiences for maximum impact.",
    author: "Elena Rodriguez",
    role: "Growth Designer",
    date: "Feb 08, 2024",
    readTime: "12 min read",
    category: "Design",
    authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhLpj1OXKAICPN8UKjFtBAruoJUQ3BGy9lUiM23vayw16wMPjjpEKJ6gT_isKyQpo6DllAQBoyA4_1bZJFTY9P40NdYyRSRLTxnRHQ5wjDe0e_FYe9W_llYIszAglpoykcKyRNTV0nynqjGLmCQ0kRu6sFoTFlGezWtTgsOv3DYLgU7AwTDuISjm65jsRu2mNg2qralJL_IyH5bMOtti_3AE2dW_2KoyrJbYzB7FYDiSTpO5B04ybpf3gCrBU9Cw9hsBR4F8CWBPY",
    heroImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8BvwvLMJVSma-8MlmspW2hKcyQBEL64MK17frR-lhy57g5evEtbQ91UdEneCVIsKLwIRNk4nv3nuZGppav7DxE2gXGsVyRULW4bj9ER4Bcz0uRur6sfdmnv5WN5z7OsaIvK2nsnyY5pCoc65ROqQg51lhji4otOxnHY7Yqon_U2d9r38ZRQfJpMtFHDLRSFlr7yJzR13S7MpJoTc6FYepjp0HcW5e_PMsHRFMVXM3YXS09mf7DZ_bLTzMN2h3nmH3UNjKQHJ---o",
  },
  "micro-interactions-user-loyalty": {
    title: "Micro-Interactions: The Secret to User Loyalty",
    subtitle: "How subtle animations drastically improve user retention.",
    author: "James Wilson",
    role: "UX Engineer",
    date: "Jan 30, 2024",
    readTime: "6 min read",
    category: "Tech",
    authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOCmjCIwUiZlphcf3jqXj83hVAeKQQ5_2uGKHLo-_Lq7GA-2CzzIc60eeK_8SlK7WRkMbUg0sD7JatmRvZs22-IV4oewwCwD31SvHGQmPydCGNEGZ_fT42JWQFvwE8X6_M9bB_8TfHbHhwLW1--ML3oznAf83t1hnyWgrsKa6fZBKUQWMbJiObXrsb0D5VTozPgyBmUkocHLKVXF2NhohX13ivknjmwd5JivDNtglgdIJB7qYMpXwPCYOjmJcA_gpnR-_Tv-zNBPg",
    heroImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuCojBiZ6ClfedLLQe0K1SaZsl21GNz2FEAbS_EKXBFND_g4gB3fzD0O1zQ3ibRqjpEtMZEMy-nTueHqVkkHlEZQwzFDjhQgtyJCyzdGbz111dSQLjQzEVyxAm1JwW_js6h79EAY6WH6_iOoWbZnqUM4nsrFsqnPbOGHFW7K35LHrGJfHtaGVP6JhS-xoXq85_MJm9t0G0f3-FT6TfOVm27M72ozq3Ulc__3lLHi0dc33dsUscmXrZ8AwVkdot-TAAMDgieN5J69tJk",
  },
  "next-gen-tech-marketing": {
    title: "How Maiyu is Shaping the Next Generation of Tech Marketing",
    subtitle: "The intersection of creativity and data-driven strategies.",
    author: "Sarah Jenkins",
    role: "Senior Design Lead",
    date: "Jan 24, 2024",
    readTime: "8 min read",
    category: "Case Study",
    authorImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxfSwKe_Nu3dY3jNDtpq5SjOZM9n77ynyexZaD9Qlb4KO0UGzskiUAyR4l4eYkbPzhkE9O3TAk8OrQrJ_c8xMtMvYJI7kTyIrLEwhqSsghRF5MYN3jrmmLh91iThH6vGbj4gOSvkEEvAUVcrT8TH5oBK2VbR3VjwX-t6nsdAhCxZjbEJzfuhD5-u7gsTLLI9CeB75qRL_t4q4bBq5HEoyoLeLMjONH7SscqM9NWbXWLl_Hm6QN9GDpRrJh9lUG1yQclB8-4SySzjc",
    heroImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDB0i68V69E2e0FkNjQO-mAM00Ueh__kkm7Peh5Uin5452L5hFyHbP-7Lvkvb1pKLjW3c5uFCKlY22UTmV-XlkKc_XE6xndApFLuia-QPC_i5De0hBi4M3evEuTQad-F1CcJ08CEPjvbBT1F84z5_oR-cnBw0ucgghP6uQj0eVlHlN0YaeSa_-HqlDBJk5okIQVkkVPLyciVfz2lzI3FCDK5ZqI2Q7JkJIZIC57XjoLCdyCN8zi7EaPvAgZF1lC4umXzJ0DbnLtt6c",
  },
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const article = slug ? mockArticles[slug] : undefined;

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-foreground mb-4">Article not found</h1>
          <Link to="/blog" className="text-maiyu-purple hover:underline">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pt-20">
      {/* Breadcrumb */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <AnimateInView variant="fadeUp">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-maiyu-purple text-sm font-semibold hover:underline">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-muted-foreground" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/blog" className="text-maiyu-purple text-sm font-semibold hover:underline">
                    Blog
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-muted-foreground" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground text-sm">{article.category}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </AnimateInView>

        <AnimateInView variant="fadeUp" delay={0.1}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-[1.15] mt-6">
            {article.title}
          </h1>
        </AnimateInView>

        <AnimateInView variant="fadeUp" delay={0.15}>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            {article.subtitle}
          </p>
        </AnimateInView>

        {/* Author Meta */}
        <AnimateInView variant="fadeUp" delay={0.2}>
          <div className="flex items-center gap-4 py-6 border-y border-border">
            <img
              alt={article.author}
              className="h-14 w-14 rounded-full object-cover border-2 border-maiyu-purple/30"
              src={article.authorImg}
            />
            <div>
              <p className="text-foreground font-bold">{article.author}</p>
              <p className="text-muted-foreground text-sm">
                {article.role} &bull; {article.date} &bull; {article.readTime}
              </p>
            </div>
          </div>
        </AnimateInView>
      </section>

      {/* Featured Image */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <AnimateInView variant="fadeUp">
          <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden bg-card shadow-2xl">
            <img
              alt={article.title}
              className="w-full h-full object-cover"
              src={article.heroImg}
            />
          </div>
        </AnimateInView>
      </div>

      {/* Content Section */}
      <article className="max-w-3xl mx-auto px-4 pb-20">
        <AnimateInView variant="fadeUp">
          <div className="prose prose-lg prose-invert dark:prose-invert max-w-none">
            <p className="text-lg leading-loose mb-8 text-muted-foreground">
              {t("blogArticle.introText")}
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12 mb-6">
              1. {t("blogArticle.section1Title")}
            </h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              {t("blogArticle.section1Text")}
            </p>

            <ul className="space-y-4 mb-8 list-none pl-0">
              {["blogArticle.bullet1", "blogArticle.bullet2", "blogArticle.bullet3"].map((key) => (
                <li key={key} className="flex items-start gap-3 text-muted-foreground">
                  <span className="text-maiyu-purple mt-1">&#10003;</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold text-foreground mt-12 mb-6">
              2. {t("blogArticle.section2Title")}
            </h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              {t("blogArticle.section2Text")}
            </p>

            <blockquote className="border-l-4 border-maiyu-purple bg-maiyu-purple/5 p-8 rounded-r-xl my-10 italic text-foreground/80 font-medium text-xl">
              {t("blogArticle.quote")}
            </blockquote>

            <h2 className="text-3xl font-bold text-foreground mt-12 mb-6">
              3. {t("blogArticle.section3Title")}
            </h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              {t("blogArticle.section3Text")}
            </p>

            {/* CTA Card */}
            <div className="mt-20 p-8 md:p-12 rounded-[2rem] bg-card border border-border text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-maiyu-purple rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-maiyu-purple/20">
                <Rocket className="text-white" size={28} />
              </div>
              <h3 className="text-3xl font-extrabold text-foreground mb-4">
                {t("blogArticle.ctaTitle")}
              </h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                {t("blogArticle.ctaDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link to="/contact">
                  <Button className="bg-maiyu-purple text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform">
                    {t("blogArticle.ctaButton1")}
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
                <Link to="/portfolio">
                  <Button variant="outline" className="bg-muted text-foreground border-border px-10 py-4 rounded-xl font-bold text-lg hover:bg-secondary transition-colors">
                    {t("blogArticle.ctaButton2")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </AnimateInView>
      </article>
    </div>
  );
};

export default BlogArticle;
