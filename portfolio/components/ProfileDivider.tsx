'use client';
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';

const ProfileDivider = () => {
  const imageRef = useRef(null);
  
  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.from(".divider-line", {
      scaleX: 0,
      duration: 1,
      ease: "power2.out"
    })
    .from(imageRef.current, {
      scale: 0,
      rotation: 360,
      duration: 1,
      ease: "back.out(1.7)"
    }, "-=0.7");
  }, []);

  return (
    <div className="inline-flex w-full items-center my-12">
      <div className="border border-accent w-4/5 h-0 divider-line"></div>
      <div className="relative mx-4">
        <Image 
          ref={imageRef}
          src="/GourdPFP.svg" 
          alt="Om Patel" 
          width={64} 
          height={64} 
          className="rounded-full border-2 border-accent p-1"
        />
      </div>
      <div className="border border-accent w-1/5 h-0 divider-line"></div>
    </div>
  );
};

export default ProfileDivider;