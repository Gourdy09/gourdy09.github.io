"use client";

import React from "react";

const FeatureCard = ({ title, description, link, linkText }: any) => (
  <div className="bg-background-alt p-6 rounded-lg shadow-lg transform hover:-translate-y-2 transition-all duration-300 bg-accent/20">
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
  </div>
);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          title={feature.title}
          description={feature.description}
          link={feature.link}
          linkText={feature.linkText}
        />
      ))}
    </div>
  );
};

export default FeatureCards;
