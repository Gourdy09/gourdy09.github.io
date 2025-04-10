'use client';

import { useRef, useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

interface MagneticOptions {
  magneticAreaWidth?: number;
  magneticAreaHeight?: number;
  magnetStrengthX?: number;
  magnetStrengthY?: number;
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
    magneticAreaWidth = 100,
    magneticAreaHeight = 100,
    magnetStrengthX = 0.4,
    magnetStrengthY = 0.4,
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
      
      // Calculate normalized distances relative to the magnetic area dimensions
      const normalizedX = distanceX / magneticAreaWidth;
      const normalizedY = distanceY / magneticAreaHeight;
      
      // Check if mouse is within magnetic area (now an ellipse rather than circle)
      // Using the formula for an ellipse: (x/a)² + (y/b)² < 1
      const isWithinMagneticArea = 
        Math.pow(distanceX / magneticAreaWidth, 2) + 
        Math.pow(distanceY / magneticAreaHeight, 2) < 1;
      
      // Only apply effect if mouse is within magnetic area
      if (isWithinMagneticArea) {
        // Calculate displacement based on distance and strength
        // The closer to the center, the stronger the effect
        mouseX.set(distanceX * magnetStrengthX);
        mouseY.set(distanceY * magnetStrengthY);
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
  }, [options, magneticAreaWidth, magneticAreaHeight, magnetStrengthX, magnetStrengthY, mouseX, mouseY]);

  return { ref: elementRef, x: springX, y: springY };
};

export default useMagneticEffect;