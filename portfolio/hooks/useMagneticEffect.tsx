'use client';

import { useRef, useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

interface MagneticOptions {
  magneticArea?: number;
  magnetStrength?: number;
  springConfig?: {
    stiffness: number;
    damping: number;
  };
}

/**
 * A custom hook that creates a magnetic effect on an element using Framer Motion
 * @param options - Configuration options for the magnetic effect
 * @returns - An object containing the ref to attach to the target element and motion values
 */
export const useMagneticEffect = (options?: MagneticOptions | null) => {
  // If options is null, the effect will be disabled
  const {
    magneticArea = 100,
    magnetStrength = 0.4,
    springConfig = {
      stiffness: 300,
      damping: 20
    }
  } = options || {};

  const elementRef = useRef<HTMLElement | null>(null);
  
  // Setup motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Add spring physics
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  
  useEffect(() => {
    // Skip effect if options is null
    if (!options) return;
    
    const element = elementRef.current;
    if (!element) return;

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = element.getBoundingClientRect();
      
      // Calculate center of the element
      const elementCenterX = rect.left + rect.width / 2;
      const elementCenterY = rect.top + rect.height / 2;
      
      // Calculate distance from mouse to element center
      const distanceX = clientX - elementCenterX;
      const distanceY = clientY - elementCenterY;
      
      // Calculate total distance using Pythagorean theorem
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      // Only apply effect if mouse is within magnetic area
      if (distance < magneticArea) {
        // Calculate displacement based on distance and strength
        mouseX.set(distanceX * magnetStrength);
        mouseY.set(distanceY * magnetStrength);
      } else {
        // Return to original position when mouse is outside magnetic area
        mouseX.set(0);
        mouseY.set(0);
      }
    };
    
    // Return to original position when mouse leaves
    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };
    
    // Add event listeners to document for mouse movement
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Cleanup function to remove event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [options, magneticArea, magnetStrength, mouseX, mouseY]);

  return { ref: elementRef, x: springX, y: springY };
};

export default useMagneticEffect;