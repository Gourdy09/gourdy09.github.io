"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import useScrollAnimation from "../../hooks/useScrollAnimation";

const AnimatedSocialLinks = () => {
  const [socialLinks, setSocialLinks] = useState<
    { name: string; link: string; icon: string }[]
  >([]);

  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  // Fetch social links data from the JSON file
  useEffect(() => {
    fetch("/data/socialLinks.json")
      .then((res) => res.json())
      .then((data) => setSocialLinks(data))
      .catch((err) => console.error("Failed to load social links:", err));
  }, []);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const scrollAnimation = useScrollAnimation({
    threshold: 0.1,
    animateWhenInView: "visible",
    animateWhenNotInView: "hidden",
  });

  return (
    <motion.div
      className="flex mb-2 gap-6 items-center"
      variants={container}
      initial="hidden"
      animate={scrollAnimation.controls}
      ref={scrollAnimation.ref}
    >
      {socialLinks.map((social) => {
        const isIconHovered = hoveredIcon === social.name;
        const isAnyIconHovered = hoveredIcon !== null;
        const shouldShrink = isAnyIconHovered && !isIconHovered;

        return (
          <motion.div key={social.name} variants={item}>
            <Link
              href={social.link}
              rel="noopener noreferrer"
              target="_blank"
              className="rounded-full bg-[#5e3d47]/80 backdrop-blur-sm transition-all duration-300 shadow-md flex items-center justify-center"
              style={{
                width: isIconHovered ? "48px" : shouldShrink ? "32px" : "36px",
                height: isIconHovered ? "48px" : shouldShrink ? "32px" : "36px",
                transform: isIconHovered
                  ? "translateY(-10px)"
                  : "translateY(0)",
                zIndex: isIconHovered ? 60 : 55,
                padding: "6px",
                margin: "-6px",
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
