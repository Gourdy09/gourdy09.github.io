'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';

const AnimatedSocialLinks = () => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  
  const socialLinks = [
    { name: "github", link: "https://github.com/Gourdy09/", icon: "/github.svg" },
    { name: "youtube", link: "https://www.youtube.com/@gourdy09", icon: "/youtube.svg" },
    { name: "instagram", link: "https://www.instagram.com/not.ompatel/", icon: "/instagram.svg" },
    { name: "linkedin", link: "https://www.linkedin.com/in/om-patel09/", icon: "/linkedin.svg" }
  ];
  
  useEffect(() => {
    // Animate social icons
    gsap.from(".social-icon", {
      scale: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: "back.out(1.7)",
      delay: 1.5 // Delay to sync with main timeline
    });
  }, []);

  return (
    <div className="w-full flex justify-center mb-8">
      <div className="flex justify-center space-x-6 py-4 px-8 border rounded-full border-accent bg-accent/10 hover:bg-accent/20 transition-all duration-300">
        {socialLinks.map((social, index) => {
          const isIconHovered = hoveredIcon === social.name;
          const isAnyIconHovered = hoveredIcon !== null;
          const shouldShrink = isAnyIconHovered && !isIconHovered;
          
          return (
            <a 
              key={index}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon rounded-full bg-secondary/50 p-3 hover:bg-primary/50 transition-all duration-300"
              style={{
                transform: isIconHovered 
                  ? 'translateY(-10px) scale(1.1)' 
                  : shouldShrink 
                    ? 'scale(0.9)' 
                    : 'scale(1)'
              }}
              onMouseEnter={() => setHoveredIcon(social.name)}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <div className="[&_img]:filter [&_img]:brightness-0 [&_img]:invert">
                <Image
                  src={social.icon}
                  width={24}
                  height={24}
                  alt={social.name}
                />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedSocialLinks;