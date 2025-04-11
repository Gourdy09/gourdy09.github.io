"use client";
import React from "react";
import { motion } from "framer-motion";
import useMagneticEffect from "../../hooks/useMagneticEffect";
import useScrollAnimation from "../../hooks/useScrollAnimation";

const SkillBadge = ({ skill }: { skill: string }) => {
  // Custom magnetic effect configuration for each skill badge
  const magneticProps = useMagneticEffect({
    magneticAreaHeight: 60,
    magneticAreaWidth: 80,
    magnetStrengthX: 0.3,
    magnetStrengthY: 0.3,
    springConfig: {
      stiffness: 150,
      damping: 15,
    },
  });

  return (
    <motion.span
      ref={magneticProps.ref as React.RefObject<HTMLSpanElement>}
      style={{ x: magneticProps.x, y: magneticProps.y }}
      className="px-4 py-2 bg-accent/20 text-primary rounded-full inline-block cursor-pointer"
      whileHover={{
        scale: 1.1,
        transition: { type: "spring", stiffness: 300, damping: 10 },
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {skill}
    </motion.span>
  );
};

const AboutContent = () => {
  const skills = [
    "React",
    "Next.js",
    "Java",
    "Unity",
    "TensorFlow",
    "Python",
    "HTML",
    "CSS",
    "Nodejs",
    "Git",
    "JavaScript",
    "TypeScript",
    "React Native",
    "Figma",
    "C#",
    "C++",
    "VEX",
    "Matplotlib",
  ];

  // Scroll animations for the text content
  const textAnimation = useScrollAnimation({
    threshold: 0.1,
    animateWhenInView: { opacity: 1, y: 0 },
    animateWhenNotInView: { opacity: 0, y: 30 },
  });

  // Scroll animations for the skills container
  const skillsAnimation = useScrollAnimation({
    threshold: 0.1,
    rootMargin: "-50px",
    animateWhenInView: "visible",
    animateWhenNotInView: "hidden",
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
      <motion.div
        className="prose prose-lg text-text"
        ref={textAnimation.ref}
        initial={{ y: 30, opacity: 0 }}
        animate={textAnimation.controls}
      >
        <p className="text-lg md:text-lg">
          Hey, I'm Om — a student, developer, and robotics enthusiast aiming to
          build a future in AI, machine learning, and robotics. I've worked
          hands-on with VEX and FTC robotics, led game development projects, and
          taught programming to students through workshops and custom made
          curricula.
        </p>
        <br />
        <p className="text-lg md:text-lg">
          Outside of work, you can find me tinkering with side projects, playing
          games, or playing with new technology. I'm big on creativity and
          always learning something new — whether that is through designing
          robots, or messing around with tech.
        </p>
      </motion.div>

      <motion.div
        className="flex flex-wrap gap-3 items-start content-start"
        variants={containerVariants}
        initial="hidden"
        animate={skillsAnimation.controls}
        ref={skillsAnimation.ref}
      >
        {skills.map((skill, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="relative z-10"
            style={{ zIndex: 10 + index }}
          >
            <SkillBadge skill={skill} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default AboutContent;
