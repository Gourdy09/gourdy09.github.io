'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';
import { Project } from '../app/types/Project'

// Demo projects data - you can replace with your actual projects
const projectsData: Project[] = [
  {
    id: 1,
    title: "AI Image Generation",
    description: "A machine learning model that generates images from textual descriptions using state-of-the-art diffusion models.",
    shortDescription: "Text-to-image generation with diffusion models",
    technologies: ["Python", "TensorFlow", "React", "Next.js"],
    timeframe: "Jan 2023 - May 2023",
    githubLink: "https://github.com/yourusername/ai-image-gen",
    liveLink: "https://ai-image-gen.demo.com",
    stats: [
      { label: "Users", value: "5,000+" },
      { label: "Images Generated", value: "120k+" },
      { label: "Stars", value: "230" }
    ],
    images: [
      "/projects/ai-gen/demo1.png",
      "/projects/ai-gen/demo2.png",
      "/projects/ai-gen/demo3.png",
      "/projects/ai-gen/architecture.png",
      "/projects/ai-gen/results.png"
    ],
    category: "AI"
  },
  {
    id: 2,
    title: "Robotics Control System",
    description: "A comprehensive control system for autonomous robots, featuring real-time pathfinding, obstacle avoidance, and machine vision integration.",
    shortDescription: "Control system for autonomous robots",
    technologies: ["C++", "ROS", "Python", "OpenCV"],
    timeframe: "Aug 2022 - Dec 2022",
    githubLink: "https://github.com/yourusername/robot-control",
    stats: [
      { label: "Accuracy", value: "97.8%" },
      { label: "Processing Speed", value: "25ms" },
      { label: "Components", value: "12" }
    ],
    images: [
      "/projects/robot/robot.png",
      "/projects/robot/interface.png",
      "/projects/robot/schematic.png"
    ],
    category: "Robotics"
  },
  {
    id: 3,
    title: "Game Development Framework",
    description: "A lightweight game development framework designed for educational purposes, making it easier for students to learn game programming concepts.",
    shortDescription: "Educational game development framework",
    technologies: ["C#", "Unity", "WebGL"],
    timeframe: "Mar 2023 - Jul 2023",
    githubLink: "https://github.com/yourusername/edu-game-framework",
    liveLink: "https://edu-game-framework.demo.com",
    stats: [
      { label: "Downloads", value: "3,200+" },
      { label: "Courses Using It", value: "15+" },
      { label: "Stars", value: "175" }
    ],
    images: [
      "/projects/game/screenshot1.png",
      "/projects/game/screenshot2.png",
      "/projects/game/diagram.png"
    ],
    category: "Game Dev"
  }
];

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalOpen(false);
    // Re-enable body scrolling when modal is closed
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="min-h-screen bg-background px-8 md:px-16 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Projects Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Projects</h2>
          <p className="text-text text-lg">
            // A selection of my technical projects across various domains
          </p>
        </motion.div>

        {/* Projects Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {projectsData.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={() => openModal(project)} 
            />
          ))}
        </motion.div>

        {/* Project Modal */}
        {selectedProject && (
          <ProjectModal 
            isOpen={modalOpen} 
            onClose={closeModal} 
            project={selectedProject} 
          />
        )}
      </div>
    </div>
  );
};

export default Projects;