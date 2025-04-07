'use client';
import React from 'react';
import { motion } from 'framer-motion';

const AboutContent = () => {
  const skills = [
    "React", "Next.js", "Java", "Unity", "TensorFlow", "Python", "HTML", "CSS", "Nodejs", "Git", "JavaScript", "TypeScript", "React Native", "Figma", "C#", "C++", "VEX", "Matplotlib"
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
      <motion.div 
        className="prose prose-lg text-text"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-lg md:text-lg">
          Hey, I'm Om — a student, developer, and robotics enthusiast aiming to build a future in AI, machine learning, and robotics. I've worked hands-on with VEX and FTC robotics, led game development projects, and taught programming to students through workshops and custom made curricula.
        </p>
        <br/>
        <p className="text-lg md:text-lg">
          Outside of work, you can find me tinkering with side projects, playing games, or playing with new technology. I'm big on creativity and always learning something new — whether that is through designing robots, or messing around with tech.
        </p>
      </motion.div>
      
      <motion.div 
        className="flex flex-wrap gap-3 items-start content-start"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {skills.map((skill, index) => (
          <motion.span 
            key={index} 
            className="px-4 py-2 bg-accent/20 text-primary rounded-full"
            variants={itemVariants}
          >
            {skill}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default AboutContent;