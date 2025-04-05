'use client';
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/dist/TextPlugin';

const AnimatedHeader = () => {
  const textRef = useRef(null);
  
  useEffect(() => {
    gsap.registerPlugin(TextPlugin);
    
    // Words to cycle through
    const words = ["AI", "Robotics", "Data Analytics", "Machine Learning", 
    "Software Development", "Game Development"];
    
    // Initial animations
    const tl = gsap.timeline();
    
    tl.from(".page-title", {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    })
    .from(".animated-text-container", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6");
    
    // Typewriter animation
    let currentWordIndex = 0;
    
    const animateNextWord = () => {
      const word = words[currentWordIndex];
      const mainTimeline = gsap.timeline();
      
      // Type the word with a smooth animation
      mainTimeline.to(textRef.current, {
        duration: word.length * 0.05,  // Faster typing speed
        text: word,
        ease: "none",
        onComplete: () => {
          // Pause at the end of typing
          gsap.delayedCall(1.5, () => {
            // Delete the word from right to left
            const deleteTimeline = gsap.timeline();
            
            // Create a smooth deletion animation from right to left
            deleteTimeline.to(textRef.current, {
              duration: word.length * 0.04,  // Slightly faster deletion
              text: "",
              ease: "none",
              onComplete: () => {
                // Move to next word
                currentWordIndex = (currentWordIndex + 1) % words.length;
                gsap.delayedCall(0.5, animateNextWord);
              }
            });
          });
        }
      });
    };
    
    // Start the animation after a small delay
    gsap.delayedCall(1, animateNextWord);
    
    // Cleanup
    return () => {
      gsap.killTweensOf(textRef.current);
      gsap.globalTimeline.clear();
    };
  }, []);

  return (
    <div className="pt-20">
      <h1 className="text-5xl md:text-7xl mb-4 font-semibold text-primary page-title">
        Hey! I'm Om Patel
      </h1>
      <div className="animated-text-container">
        <h3 className="text-2xl md:text-3xl mx-0 md:mx-12 text-text flex items-center h-12">
          // Currently Working On <span className="relative ml-2">
            <span ref={textRef} className="inline-block"></span>
          </span>
        </h3>
      </div>
    </div>
  );
};

export default AnimatedHeader;