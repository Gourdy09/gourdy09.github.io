"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import { Project } from "../../app/types/Project";

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectsData, setProjectsData] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/data/projectsData.json")
      .then((res) => res.json())
      .then((data) => setProjectsData(data))
      .catch((err) => console.error("Failed to load projects:", err));
  }, []);

  const openModal = (project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalOpen(false);
    // Re-enable body scrolling when modal is closed
    document.body.style.overflow = "auto";
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
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
            PROJECTS
          </h2>
          <p className="text-text text-lg">
            // A few things I did at some point in time
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
                staggerChildren: 0.15,
              },
            },
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
