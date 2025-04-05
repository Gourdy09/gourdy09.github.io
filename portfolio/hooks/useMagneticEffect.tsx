'use client';

// hooks/useMagneticEffect.ts
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface MagneticOptions {
  magneticArea?: number;
  magnetStrength?: number;
  returnDuration?: number;
  returnEase?: string;
}

/**
 * A custom hook that creates a magnetic effect on an element
 * @param options - Configuration options for the magnetic effect
 * @returns - The ref to attach to the target element
 */
export const useMagneticEffect = (options?: MagneticOptions | null) => {
  // If options is null, the effect will be disabled
  const {
    magneticArea = 100,
    magnetStrength = 0.4,
    returnDuration = 1,
    returnEase = "elastic.out(1, 0.3)"
  } = options || {};

  // Use generic HTMLElement type for the ref
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Skip effect if options is null
    if (!options) return;
    
    const element = elementRef.current;
    if (!element) return;

    // Store the initial position
    const initialX = 0;
    const initialY = 0;

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
        const moveX = distanceX * magnetStrength;
        const moveY = distanceY * magnetStrength;
        
        // Animate to new position with smooth transition
        gsap.to(element, {
          x: moveX,
          y: moveY,
          duration: 1,
          ease: "elastic.out(1, 0.3)"
        });
      } else {
        // Return to original position when mouse is outside magnetic area
        gsap.to(element, {
          x: initialX,
          y: initialY,
          duration: returnDuration,
          ease: returnEase
        });
      }
    };
    
    // Return to original position when mouse leaves
    const handleMouseLeave = () => {
      gsap.to(element, {
        x: initialX,
        y: initialY,
        duration: returnDuration,
        ease: returnEase
      });
    };
    
    // Add event listeners to document for mouse movement
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Cleanup function to remove event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [options, magneticArea, magnetStrength, returnDuration, returnEase]);

  return elementRef;
};

export default useMagneticEffect;