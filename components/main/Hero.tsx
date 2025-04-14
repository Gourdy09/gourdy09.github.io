"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Chip from "./Chip";
import useMagneticEffect from "../../hooks/useMagneticEffect";
import SocialBar from "./SocialBar";

function Hero() {
  // Custom magnetic effect for "ROBOTICS" text
  const roboticsMagneticProps = useMagneticEffect({
    magneticAreaHeight: 75,
    magneticAreaWidth: 300, // Wider area for the text
    magnetStrengthX: 0.3, // Gentle horizontal effect
    magnetStrengthY: 0.3, // Gentle vertical effect
    springConfig: {
      stiffness: 100, // Lower stiffness for smoother movement
      damping: 15, // Lower damping for more bounce
    },
  });

  // Custom magnetic effect for "AI & DEVELOPER" text
  const aiMagneticProps = useMagneticEffect({
    magneticAreaHeight: 90,
    magneticAreaWidth: 100,
    magnetStrengthX: 0.2, // Subtle effect
    magnetStrengthY: 0.15,
    springConfig: {
      stiffness: 120,
      damping: 12,
    },
  });

  // Custom magnetic effect for "DEVELOPER" text
  const developerMagneticProps = useMagneticEffect({
    magneticAreaHeight: 100,
    magneticAreaWidth: 250, // Wide area for longer text
    magnetStrengthX: 0.25,
    magnetStrengthY: 0.2,
    springConfig: {
      stiffness: 150,
      damping: 18,
    },
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -200 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 70, // Lower stiffness for smoother movement
        damping: 15, // Balanced damping for deceleration
        mass: 1.2, // Slightly higher mass for momentum
        velocity: 2, // Initial velocity for acceleration effect
      },
    },
  };

  return (
    <div className="pt-32 sm:pt-40 md:pt-60 bg-background flex items-center justify-center flex-col px-4">
      {/* Content */}
      <motion.div
        className="flex flex-col mb-20 sm:mb-40 w-full max-w-4xl border-2 gap-2 items-center sm:items-start sm:pl-48"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Top Row - Hidden on mobile */}
        <motion.div
          className="hidden sm:flex flex-row gap-4 items-center"
          variants={item}
        >
          <Image
            className="rounded-full"
            src="/images/gourdpfp.svg"
            width={40}
            height={40}
            alt=""
          />
          <Chip
            text="What's up, I'm Om"
            magneticAreaWidth={70}
            magneticAreaHeight={70}
          />
        </motion.div>

        {/* Mid Row */}
        <div className="flex flex-col gap-2 sm:gap-4">
          <motion.div
            className="flex flex-row items-center gap-16 align-middle"
            variants={item}
          >
            <motion.h1
              className="text-4xl sm:text-6xl md:text-8xl font-extrabold text-text"
              ref={aiMagneticProps.ref as React.RefObject<HTMLHeadingElement>}
              style={{ x: aiMagneticProps.x, y: aiMagneticProps.y }}
            >
              <span className="text-primary">AI</span> &
            </motion.h1>

            {/* Let's talk chip - Hidden on mobile */}
            <div className="hidden sm:flex">
              <a href="mailto:patel.omtx@gmail.com">
                <Chip
                  image="/icons/available.svg"
                  text="Let's talk"
                  magnetic={true}
                  magneticAreaWidth={70}
                  magneticAreaHeight={70}
                  pulse={true}
                />
              </a>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-6xl md:text-8xl font-extrabold text-secondary"
            variants={item}
            ref={
              roboticsMagneticProps.ref as React.RefObject<HTMLHeadingElement>
            }
            style={{ x: roboticsMagneticProps.x, y: roboticsMagneticProps.y }}
          >
            ROBOTICS
          </motion.h1>

          <motion.h1
            className="text-4xl sm:text-6xl md:text-8xl font-extrabold text-text"
            variants={item}
            ref={
              developerMagneticProps.ref as React.RefObject<HTMLHeadingElement>
            }
            style={{ x: developerMagneticProps.x, y: developerMagneticProps.y }}
          >
            DEVELOPER
          </motion.h1>

          <motion.h4 className="text-text text-base sm:text-xl" variants={item}>
            // Based in Houston, TX
          </motion.h4>
        </div>
      </motion.div>

      {/* Bot Row - Full width for mobile */}
      <motion.div
        className="flex w-full"
        initial={{ opacity: 0, x: -200 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: 1.2,
          type: "spring",
          stiffness: 70,
          damping: 15,
          mass: 1.2,
          velocity: 2,
        }}
      >
        <SocialBar />
      </motion.div>
    </div>
  );
}

export default Hero;
