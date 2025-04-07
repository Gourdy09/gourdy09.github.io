'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Chip from './Chip';
import useMagneticEffect from '../../hooks/useMagneticEffect';
import SocialBar from './SocialBar';

function Hero() {
  // Example of applying magnetic effect to another element
  const magneticProps = useMagneticEffect({
    magneticArea: 150,    // Larger area
    magnetStrength: 0.3,  // Gentler effect
    springConfig: {
      stiffness: 100,    // Lower stiffness for smoother movement
      damping: 15        // Lower damping for more bounce
    }
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    // Wrapper
    <div className='pt-60 bg-background flex items-center justify-center flex-col'>
        {/* Content */}
        <motion.div 
          className='flex flex-col mb-40'
          variants={container}
          initial="hidden"
          animate="show"
        >
            {/* Top Row */}
            <motion.div 
              className='flex flex-row gap-4 items-center'
              variants={item}
            >
                <Image className='rounded-full'
                    src="/GourdPFP.svg"
                    width={52}
                    height={52}
                    alt=""
                />
                <Chip
                    text="What's up, I'm Om"
                    area={70}
                />
            </motion.div>

            {/* Mid Row */}
            <div className='flex flex-col gap-4'>
                <motion.div 
                  className='flex flex-row gap-8 items-center'
                  variants={item}
                >
                    <h1 className='text-8xl font-extrabold text-text'>
                        <span className='text-primary'>AI</span> &
                    </h1>

                    <Chip
                        image="/Available.svg"
                        text="Let's talk"
                        magnetic={true}
                        area={70}
                        pulse={true}
                    />
                </motion.div>
                
                <motion.h1 
                    className='text-8xl font-extrabold text-secondary'
                    variants={item}
                    ref={magneticProps.ref as React.RefObject<HTMLHeadingElement>}
                    style={{ x: magneticProps.x, y: magneticProps.y }}
                >
                    ROBOTICS
                </motion.h1>
                
                <motion.h1 
                  className='text-8xl font-extrabold text-text'
                  variants={item}
                >
                    DEVELOPER
                </motion.h1>

                <motion.h4 
                  className='text-text text-xl'
                  variants={item}
                >
                    // Based in Houston, TX
                </motion.h4>
            </div>
        </motion.div>

        {/* Bot Row */}
        <motion.div 
          className='flex'
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 1.2,
            type: "spring",
            stiffness: 100,
            damping: 10
          }}
        >
            <SocialBar/>
        </motion.div>
    </div>
  );
}

export default Hero;