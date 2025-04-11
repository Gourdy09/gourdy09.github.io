import { useEffect } from "react";
import {
  useAnimation,
  VariantLabels,
  TargetAndTransition,
} from "framer-motion";
import { useInView } from "react-intersection-observer";

type AnimationControls = ReturnType<typeof useAnimation>;

interface UseScrollAnimationOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
  animateWhenInView?: VariantLabels | TargetAndTransition;
  animateWhenNotInView?: VariantLabels | TargetAndTransition;
}

const defaultOptions: UseScrollAnimationOptions = {
  threshold: 0.2,
  triggerOnce: true,
  rootMargin: "0px",
  animateWhenInView: { opacity: 1, y: 0 },
  animateWhenNotInView: { opacity: 0, y: 50 },
};

/**
 * Custom hook for scroll-triggered animations
 */
const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const mergedOptions = { ...defaultOptions, ...options };
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: mergedOptions.threshold,
    triggerOnce: mergedOptions.triggerOnce,
    rootMargin: mergedOptions.rootMargin,
  });

  useEffect(() => {
    if (inView) {
      controls.start(mergedOptions.animateWhenInView!);
    } else if (!mergedOptions.triggerOnce) {
      controls.start(mergedOptions.animateWhenNotInView!);
    }
  }, [controls, inView, mergedOptions]);

  return { ref, controls, inView };
};

export default useScrollAnimation;
