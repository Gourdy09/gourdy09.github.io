"use client";
import React, { useState, useLayoutEffect } from "react";
import { motion } from "framer-motion";

const AnimatedHeader = () => {
  const [text, setText] = useState("");
  const [isClient, setIsClient] = useState(false);
  const cursorRef = React.useRef(null);

  const words = [
    "AI",
    "Robotics",
    "Data Analytics",
    "Machine Learning",
    "Software Development",
    "Game Development",
  ];

  useLayoutEffect(() => {
    setIsClient(true);

    let currentWordIndex = 0;
    let isMounted = true;

    const cycleWords = async () => {
      while (isMounted) {
        const word = words[currentWordIndex];

        // Type the word
        for (let i = 0; i <= word.length; i++) {
          if (!isMounted) return;
          setText(word.substring(0, i));
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Wait with full word
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (!isMounted) return;

        // Delete the word
        for (let i = word.length; i >= 0; i--) {
          if (!isMounted) return;
          setText(word.substring(0, i));
          await new Promise((resolve) => setTimeout(resolve, 40));
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!isMounted) return;

        currentWordIndex = (currentWordIndex + 1) % words.length;
      }
    };

    cycleWords();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isClient) return null;

  return (
    <div className="pt-20">
      <motion.h1
        className="text-5xl md:text-7xl mb-4 font-extrabold text-primary"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.175, 0.885, 0.32, 1.275] }}
      >
        HEY, I'M OM PATEL
      </motion.h1>
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
        <h3 className="text-2xl md:text-3xl text-text flex items-center">
          <span>// Currently Working On</span>{" "}
          <span className="relative ml-2">
            <span ref={cursorRef} className="inline-block" key={text}>
              {text}
            </span>
          </span>
        </h3>
      </motion.div>
    </div>
  );
};

export default AnimatedHeader;
