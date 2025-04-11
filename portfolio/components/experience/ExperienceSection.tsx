"use client";
import React, { useState, useEffect } from "react";
import ExperienceCard from "./ExperienceCard";
import { Experience } from "../../app/types/Experience";
import { motion } from "framer-motion";

const ExperienceSection = () => {
  const [experienceData, setExperienceData] = useState<Experience[]>([]);

  useEffect(() => {
    fetch("/data/experienceData.json")
      .then((res) => res.json())
      .then((data) => setExperienceData(data))
      .catch((err) => console.error("Failed to load experience data:", err));
  }, []);

  return (
    <div className="min-h-screen bg-background px-8 md:px-16 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Experience Header with scroll animation */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1], // Custom ease for smooth animation
          }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
            EXPERIENCE
          </h2>
          <p className="text-text text-lg">
            // My professional journey and contributions
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Animated Vertical Line */}
          <motion.div
            className="absolute left-0 md:left-1/2 transform md:translate-x-[-50%] w-px bg-accent origin-top"
            style={{ height: "100%" }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Experience Cards */}
          <div className="relative">
            {experienceData.map((experience, index) => (
              <div key={experience.id}>
                <ExperienceCard
                  experience={experience}
                  isEven={index % 2 === 0}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceSection;
