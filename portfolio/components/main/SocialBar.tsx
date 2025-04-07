"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface SocialLink {
  name: string;
  link: string;
  image: string;
}

export default function SocialBar() {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const socialLinks: SocialLink[] = [
    { name: "github", link: "https://github.com/Gourdy09/", image: '/github.svg' },
    { name: "youtube", link: "https://www.youtube.com/@gourdy09", image: '/youtube.svg' },
    { name: "instagram", link: "https://www.instagram.com/not.ompatel/", image: '/instagram.svg' },
    { name: "linkedin", link: "https://www.linkedin.com/in/om-patel09/", image: '/linkedin.svg' }
  ];

  return (
    <div className="flex flex-row border-t border-b border-accent w-screen items-center justify-between h-24 gap-12 px-12">

      <div className="flex flex-row items-center h-24">
        <h4 className="text-text">
          // I do things <br /> sometimes
        </h4>
      </div>

      <div className="flex mb-2 gap-6 items-center">
        {socialLinks.map((social) => {
          const isIconHovered = hoveredIcon === social.name;
          const isAnyIconHovered = hoveredIcon !== null;
          const shouldShrink = isAnyIconHovered && !isIconHovered;

          return (
            <Link
              key={social.name}
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
                  src={social.image}
                  width={isIconHovered ? 28 : shouldShrink ? 18 : 22}
                  height={isIconHovered ? 28 : shouldShrink ? 18 : 22}
                  alt={social.name}
                />
              </div>
            </Link>
          );
        })}
      </div>
      
      
    </div>
  );
}
