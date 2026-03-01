import { type HTMLMotionProps, type Variants, motion } from "framer-motion";
import type { ReactNode } from "react";

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function AnimateInView({
  children,
  variant = "fadeUp",
  delay = 0,
  className,
  ...props
}: {
  children: ReactNode;
  variant?: "fadeUp" | "fadeIn";
  delay?: number;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "variants">) {
  const variants = variant === "fadeUp" ? fadeUpVariants : fadeInVariants;

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function StaggerContainer({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "variants">) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
