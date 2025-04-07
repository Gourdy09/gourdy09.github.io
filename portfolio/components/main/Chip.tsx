'use client';

import Image from 'next/image';
import React from 'react';
import { motion } from 'framer-motion';
import useMagneticEffect from '../../hooks/useMagneticEffect';

interface ChipProps {
  text: string;
  image?: string;
  magnetic?: boolean;
  area?: number;
  width?: number;
  height?: number;
  pulse?: boolean;
}

function Chip({ text, image, area = 70, width = 16, height = 16, magnetic = false, pulse = false }: ChipProps) {
  // Only apply magnetic effect if magnetic prop is true
  const magneticProps = useMagneticEffect(magnetic ? {
    magneticArea: area,
    magnetStrength: 0.4,
    springConfig: {
      stiffness: 300,
      damping: 20
    }
  } : null);

  const pulseAnimation = pulse ? {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};
  
  if (image) {
    return (
      <motion.div
        style={magnetic ? { x: magneticProps.x, y: magneticProps.y } : {}}
        ref={magneticProps.ref as React.RefObject<HTMLDivElement>}
        className='flex flex-row align-middle gap-3 border border-primary rounded-full px-4 py-2 max-h-16 items-center mt-4 cursor-pointer'
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {pulse ? (
          <div className="relative">
            <motion.div
              animate={pulseAnimation}
              className="absolute inset-0"
            >
              <Image
                className='rounded-full'
                src={image}
                width={width}
                height={height}
                alt=""
              />
            </motion.div>
            <Image
              className='rounded-full'
              src={image}
              width={width}
              height={height}
              alt=""
            />
          </div>
        ) : (
          <Image
            className='rounded-full bg-text px-1 py-1'
            src={image}
            width={width}
            height={height}
            alt=""
          />
        )}
        <h1 className='text-text pl-1 pr-4 pt-1 pb-1 text-xl'>{text}</h1>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={magnetic ? { x: magneticProps.x, y: magneticProps.y } : {}}
      ref={magneticProps.ref as React.RefObject<HTMLDivElement>}
      className='border border-primary rounded-full px-4 py-2 max-h-16'
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <h1 className='text-text pl-4 pr-4 pt-1 pb-1 text-xl'>{text}</h1>
    </motion.div>
  );
}

export default Chip;