'use client';
import React, { useEffect } from 'react';
import { gsap } from 'gsap';

const FeatureCard = ({ title, description, link, linkText, icon, index }: any) => {
  useEffect(() => {
    // Individual card animation
    gsap.from(`#feature-card-${index}`, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      delay: 0.1 * index + 1.2, // Staggered delay
      ease: "back.out(1.7)"
    });
  }, [index]);

  return (
    <div 
      id={`feature-card-${index}`}
      className="bg-accent/20 p-6 rounded-lg shadow-lg transform hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-primary"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-2xl font-medium text-primary mb-3">{title}</h3>
      <p className="text-text mb-4">{description}</p>
      <a 
        href={link} 
        className="inline-flex items-center text-accent hover:text-primary transition-colors"
      >
        {linkText} 
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </a>
    </div>
  );
};

const EnhancedFeatureCards = () => {
  const features = [
    {
      title: "Projects",
      description: "Crafting solutions that combine innovation with utility.",
      link: "#projects",
      linkText: "View my work",
      icon: "🚀"
    },
    {
      title: "Experience",
      description: "From startups to established companies, building for impact.",
      link: "#experience",
      linkText: "See my journey",
      icon: "💼"
    },
    {
      title: "Contact",
      description: "Let's connect and discuss your next big idea.",
      link: "#contact",
      linkText: "Get in touch",
      icon: "✉️"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {features.map((feature, index) => (
        <FeatureCard 
          key={index}
          index={index}
          title={feature.title}
          description={feature.description}
          link={feature.link}
          linkText={feature.linkText}
          icon={feature.icon}
        />
      ))}
    </div>
  );
};

export default FeatureCard;