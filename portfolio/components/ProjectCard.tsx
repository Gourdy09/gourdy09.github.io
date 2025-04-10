import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../portfolio/app/types/Project';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <motion.div
      className="bg-accent/20 rounded-lg overflow-hidden cursor-pointer group"
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={onClick}
    >
      {/* Card Content */}
      <div className="p-6 h-full flex flex-col justify-between border border-transparent group-hover:border-primary transition-all duration-300">
        {/* Top content */}
        <div>
          {/* Category Badge */}
          <span className="inline-block text-xs font-medium text-primary px-2 py-1 rounded-full bg-primary/20 mb-3">
            {project.category}
          </span>
          
          {/* Title */}
          <h3 className="text-2xl font-medium text-primary mb-2 group-hover:translate-x-1 transition-all duration-300">
            {project.title}
          </h3>
          
          {/* Short Description */}
          <p className="text-text mb-4">
            {project.shortDescription}
          </p>
          
          {/* Technologies */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.technologies.slice(0, 3).map((tech, index) => (
              <span key={index} className="px-2 py-1 text-xs font-medium bg-secondary/20 text-text rounded-md">
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium bg-secondary/20 text-text rounded-md">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center">
          {/* Timeframe */}
          <span className="text-sm text-accent">
            {project.timeframe}
          </span>
          
          {/* View Details Button */}
          <div className="flex items-center text-primary group-hover:translate-x-1 transition-all duration-300">
            <span className="mr-1">View</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;