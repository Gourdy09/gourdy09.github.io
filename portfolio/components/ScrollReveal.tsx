"use client";
import React from "react";
import { motion, Variants } from "framer-motion";
import useScrollAnimation from "../hooks/useScrollAnimation";

interface ScrollRevealProps {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  delay?: number;
  duration?: number;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variants,
  className = "",
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
  direction = "up",
  distance = 50,
  delay = 0,
  duration = 0.5,
}) => {
  // Set default variants based on direction
  const getDefaultVariants = (): Variants => {
    const directions = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
    };

    return {
      hidden: {
        opacity: 0,
        ...directions[direction],
      },
      visible: {
        opacity: 1,
        ...(direction.includes("y") ? { y: 0 } : { x: 0 }),
        transition: {
          duration,
          delay,
          ease: "easeOut",
        },
      },
    };
  };

  const finalVariants = variants || getDefaultVariants();

  const scrollAnimation = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce,
    animateWhenInView: "visible",
    animateWhenNotInView: "hidden",
  });

  return (
    <motion.div
      ref={scrollAnimation.ref}
      variants={finalVariants}
      initial="hidden"
      animate={scrollAnimation.controls}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
