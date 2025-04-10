'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const AnimatedSocialLinks = () => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  
  const socialLinks = [
    { name: "github", link: "https://github.com/Gourdy09/", icon: "/github.svg" },
    { name: "youtube", link: "https://www.youtube.com/@gourdy09", icon: "/youtube.svg" },
    { name: "instagram", link: "https://www.instagram.com/not.ompatel/", icon: "/instagram.svg" },
    { name: "linkedin", link: "https://www.linkedin.com/in/om-patel09/", icon: "/linkedin.svg" }
  ];
  
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <motion.div 
      className="flex mb-2 gap-6 items-center"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {socialLinks.map((social, index) => {
        const isIconHovered = hoveredIcon === social.name;
        const isAnyIconHovered = hoveredIcon !== null;
        const shouldShrink = isAnyIconHovered && !isIconHovered;
        
        return (
          <motion.div
            key={social.name}
            variants={item}
          >
            <Link
              href={social.link}
              rel="noopener noreferrer"
              target="_blank"
              className="rounded-full bg-[#5e3d47]/80 backdrop-blur-sm transition-all duration-300 shadow-md flex items-center justify-center"
              style={{
                width: isIconHovered ? '48px' : shouldShrink ? '32px' : '36px',
                height: isIconHovered ? '48px' : shouldShrink ? '32px' : '36px',
                transform: isIconHovered ? 'translateY(-10px)' : 'translateY(0)',
                zIndex: isIconHovered ? 60 : 55,
                padding: '6px',
                margin: '-6px',
              }}
              onMouseEnter={() => setHoveredIcon(social.name)}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <div className="[&_img]:filter [&_img]:brightness-0 [&_img]:invert flex items-center justify-center">
                <Image
                  src={social.icon}
                  width={isIconHovered ? 28 : shouldShrink ? 18 : 22}
                  height={isIconHovered ? 28 : shouldShrink ? 18 : 22}
                  alt={social.name}
                />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default AnimatedSocialLinks;