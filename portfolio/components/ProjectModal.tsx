import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../portfolio/app/types/Project';
import Image from 'next/image';
import Link from 'next/link';

interface ProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Handle click outside modal content to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="bg-background border border-accent rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Modal Content */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-accent">
                <h2 className="text-2xl font-bold text-primary">{project.title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-accent/20 transition-colors"
                >
                  <svg className="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
                {/* Left Side - Project Info */}
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-medium text-primary mb-2">Description</h3>
                    <p className="text-text">{project.description}</p>
                  </div>

                  {/* Technologies */}
                  <div>
                    <h3 className="text-xl font-medium text-primary mb-2">Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, index) => (
                        <span key={index} className="px-3 py-1 bg-secondary/20 text-text rounded-md text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Timeframe */}
                  <div>
                    <h3 className="text-xl font-medium text-primary mb-2">Timeframe</h3>
                    <p className="text-text">{project.timeframe}</p>
                  </div>

                  {/* Stats */}
                  {project.stats && (
                    <div>
                      <h3 className="text-xl font-medium text-primary mb-2">Stats</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {project.stats.map((stat, index) => (
                          <div key={index} className="bg-accent/10 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-primary">{stat.value}</div>
                            <div className="text-sm text-text">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-4">
                    {project.githubLink && (
                      <Link
                        href={project.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-accent/20 hover:bg-accent/30 rounded-lg text-text transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        GitHub
                      </Link>
                    )}
                    {project.liveLink && (
                      <Link
                        href={project.liveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-text transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Live Demo
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right Side - Images Bento Grid */}
                <div className="space-y-4">
                  {project.images && project.images.length > 0 && (
                    <>
                      {/* Main Image */}
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-accent">
                        {/* Using placeholder for demo - replace with actual project images */}
                        <div className="relative h-full w-full">
                          <Image
                            src="/api/placeholder/800/450"
                            alt={`${project.title} screenshot ${selectedImageIndex + 1}`}
                            layout="fill"
                            objectFit="cover"
                            className="transition-opacity duration-300"
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-text bg-background/50">
                            Project Image {selectedImageIndex + 1}
                          </div>
                        </div>
                      </div>

                      {/* Thumbnails Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {project.images.map((image, index) => (
                          <div
                            key={index}
                            className={`relative aspect-square rounded-md overflow-hidden cursor-pointer transition-all duration-200 ${
                              index === selectedImageIndex ? 'ring-2 ring-primary scale-95' : 'opacity-70 hover:opacity-100'
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            {/* Using placeholder for demo - replace with actual project images */}
                            <div className="relative h-full w-full">
                              <Image
                                src="/api/placeholder/200/200"
                                alt={`${project.title} thumbnail ${index + 1}`}
                                layout="fill"
                                objectFit="cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-text bg-background/50">
                                {index + 1}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;