"use client";

import React from "react";
import { motion } from "framer-motion";
import useScrollAnimation from "../../hooks/useScrollAnimation";

const FeatureCard = ({ title, description, link, linkText, index }: any) => {
  const cardAnimation = useScrollAnimation({
    threshold: 0.1,
    rootMargin: "-20px",
    animateWhenInView: { opacity: 1, y: 0 },
    animateWhenNotInView: { opacity: 0, y: 30 },
  });

  return (
    <motion.div
      ref={cardAnimation.ref}
      initial={{ opacity: 0, y: 30 }}
      animate={cardAnimation.controls}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-background-alt p-6 rounded-lg shadow-lg transform hover:-translate-y-2 transition-all duration-300 bg-accent/20"
    >
      <h3 className="text-2xl font-medium text-primary mb-3">{title}</h3>
      <p className="text-text mb-4">{description}</p>
      <a
        href={link}
        className="text-accent hover:text-accent-hover underline"
        onClick={(e) => {
          // Only apply smooth scroll for anchor links
          if (link.startsWith("#")) {
            e.preventDefault();
            const targetId = link.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth" });
            }
          }
        }}
      >
        {linkText} →
      </a>
    </motion.div>
  );
};

const FeatureCards = () => {
  const features = [
    {
      title: "Projects",
      description: "Crafting solutions that combine innovation with utility.",
      link: "#projects",
      linkText: "View my work",
    },
    {
      title: "Experience",
      description:
        "From startups to established companies, building for impact.",
      link: "#work",
      linkText: "See my journey",
    },
    {
      title: "Contact",
      description: "Let's connect and build something that makes an impact.",
      link: "mailto:patel.omtx@gmail.com",
      linkText: "Get in touch",
    },
  ];

  const containerAnimation = useScrollAnimation({
    threshold: 0.1,
    animateWhenInView: { opacity: 1 },
    animateWhenNotInView: { opacity: 0 },
  });

  return (
    <motion.div
      ref={containerAnimation.ref}
      initial={{ opacity: 0 }}
      animate={containerAnimation.controls}
      className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
    >
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          index={index}
          title={feature.title}
          description={feature.description}
          link={feature.link}
          linkText={feature.linkText}
        />
      ))}
    </motion.div>
  );
};

export default FeatureCards;
