'use client';
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AboutContent = () => {
  const descriptionRef = useRef(null);
  
  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.from(descriptionRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8
    })
    .from(".skill-pill", {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      ease: "power1.out"
    }, "-=0.3");
  }, []);

  const skills = [
    "React", "Next.js", "Java", "Unity", "TensorFlow", "Python", "HTML", "CSS", "Nodejs", "Git", "JavaScript", "TypeScript", "React Native", "Figma", "C#", "C++", "VEX", "Matplotlib"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
      <div ref={descriptionRef} className="prose prose-lg text-text">
        <p className="text-lg md:text-lg">
        Hey, I'm Om — a student, developer, and robotics enthusiast aiming to build a future in AI, machine learning, and robotics. I've worked hands-on with VEX and FTC robotics, led game development projects, and taught programming to students through workshops and custom made curricula.
        </p>
        <br/>
        <p className="text-lg md:text-lg">
          Outside of work, you can find me tinkering with side projects, playing games, or playing with new technology. I'm big on creativity and always learning something new — whether that is through designing robots, or messing around with tech.
        </p>
      </div>
      
      <div className="flex flex-wrap gap-3 items-start content-start">
        {skills.map((skill, index) => (
          <span 
            key={index} 
            className="skill-pill px-4 py-2 bg-accent/20 text-primary rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AboutContent;