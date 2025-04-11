"use client";
import React, { useState, useEffect } from "react";
import { motion, useAnimate } from "framer-motion";

const AnimatedHeader = () => {
  const [text, setText] = useState("");
  const [scope, animate] = useAnimate();

  // Words to cycle through
  const words = [
    "AI",
    "Robotics",
    "Data Analytics",
    "Machine Learning",
    "Software Development",
    "Game Development",
  ];

  useEffect(() => {
    let currentWordIndex = 0;

    const cycleWords = async () => {
      while (true) {
        const word = words[currentWordIndex];

        // Type the word
        for (let i = 0; i <= word.length; i++) {
          setText(word.substring(0, i));
          await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms per character
        }

        // Wait at full word
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Delete the word
        for (let i = word.length; i >= 0; i--) {
          setText(word.substring(0, i));
          await new Promise((resolve) => setTimeout(resolve, 40)); // 40ms per character deletion
        }

        // Small pause before next word
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Move to next word
        currentWordIndex = (currentWordIndex + 1) % words.length;
      }
    };

    cycleWords();

    // Cleanup - not strictly necessary as we're using a forever loop
    return () => {
      setText("");
    };
  }, []);

  return (
    <div className="pt-20">
      <motion.h1
        className="text-5xl md:text-7xl mb-4 font-extrabold text-primary"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.175, 0.885, 0.32, 1.275] }}
      >
        HEY, IM OM PATEL
      </motion.h1>
      {/* This line will only be visible on md (tablet) screens and larger */}
      <motion.div
        className="hidden md:block"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.175, 0.885, 0.32, 1.275],
          delay: 0.4,
        }}
      >
        <h3 className="text-2xl md:text-3xl mx-4 md:mx-12 text-text flex items-center">
          // Currently Working On{" "}
          <span className="relative ml-2">
            <span ref={scope} className="inline-block">
              {text}
            </span>
          </span>
        </h3>
      </motion.div>
    </div>
  );
};

export default AnimatedHeader;
