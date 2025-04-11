"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import useMagneticEffect from "../../hooks/useMagneticEffect";

interface ChipProps {
  text: string;
  image?: string;
  magnetic?: boolean;
  magneticAreaWidth?: number;
  magneticAreaHeight?: number;
  magnetStrengthX?: number;
  magnetStrengthY?: number;
  width?: number;
  height?: number;
  pulse?: boolean;
}

function Chip({
  text,
  image,
  magneticAreaWidth = 70,
  magneticAreaHeight = 70,
  magnetStrengthX = 0.4,
  magnetStrengthY = 0.4,
  width = 16,
  height = 16,
  magnetic = false,
  pulse = false,
}: ChipProps) {
  // Only apply magnetic effect if magnetic prop is true
  const magneticProps = useMagneticEffect(
    magnetic
      ? {
          magneticAreaWidth: 60,
          magneticAreaHeight: 60,
          magnetStrengthX,
          magnetStrengthY,
          springConfig: {
            stiffness: 300,
            damping: 20,
          },
        }
      : null
  );

  const pulseAnimation = pulse
    ? {
        scale: [1, 1.2, 1],
        opacity: [1, 0.8, 1],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }
    : {};

  if (image) {
    return (
      <motion.div
        style={magnetic ? { x: magneticProps.x, y: magneticProps.y } : {}}
        ref={magneticProps.ref as React.RefObject<HTMLDivElement>}
        className="flex flex-row align-middle gap-2 sm:gap-3 border border-primary rounded-full px-3 sm:px-4 py-1 sm:py-2 max-h-16 items-center cursor-pointer"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {pulse ? (
          <div className="relative">
            <motion.div animate={pulseAnimation} className="absolute inset-0">
              <Image
                className="rounded-full"
                src={image}
                width={width}
                height={height}
                alt=""
              />
            </motion.div>
            <Image
              className="rounded-full"
              src={image}
              width={width}
              height={height}
              alt=""
            />
          </div>
        ) : (
          <Image
            className="rounded-full bg-text px-1 py-1"
            src={image}
            width={width}
            height={height}
            alt=""
          />
        )}
        <h1 className="text-text pl-1 pr-2 sm:pr-4 pt-1 pb-1 text-sm sm:text-xl">
          {text}
        </h1>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={magnetic ? { x: magneticProps.x, y: magneticProps.y } : {}}
      ref={magneticProps.ref as React.RefObject<HTMLDivElement>}
      className="border border-primary rounded-full px-3 sm:px-4 py-1 sm:py-2 max-h-16"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <h1 className="text-text pl-2 sm:pl-4 pr-2 sm:pr-4 pt-1 pb-1 text-sm sm:text-xl">
        {text}
      </h1>
    </motion.div>
  );
}

export default Chip;
