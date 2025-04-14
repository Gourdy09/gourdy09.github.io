import React from "react";
import { Experience } from "../../app/types/Experience";
import { motion } from "framer-motion";
import Image from "next/image";

interface ExperienceCardProps {
  experience: Experience;
  isEven: boolean;
  index: number;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({
  experience,
  isEven,
  index,
}) => {
  return (
    <div
      className={`mb-12 md:mb-16 relative flex flex-col ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      {/* Timeline Node with animation */}
      <motion.div
        className="absolute left-4 sm:left-0 md:left-1/2 transform md:translate-x-[-50%] top-6 md:top-8 z-10"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{
          delay: 0.3,
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
      >
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary border-4 border-background" />
      </motion.div>

      {/* Content with animation */}
      <div
        className={`w-full md:w-1/2 ${
          isEven ? "md:pr-12 md:pl-0" : "md:pl-12 md:pr-0"
        }`}
      >
        <motion.div
          className={`ml-8 md:ml-0 p-4 sm:p-6 rounded-lg bg-accent/10 border border-accent/30 transition-all duration-300 hover:border-primary relative text-left ${
            isEven ? "md:mr-6" : "md:ml-6"
          }`}
          initial={{
            opacity: 0,
            x: isEven ? -50 : 50, // Reduced animation distance for mobile
          }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{
            duration: 0.7,
            delay: index * 0.1, // Staggered delay for each card
            type: "spring",
            stiffness: 70,
            damping: 15,
          }}
        >
          {/* Card Arrow */}
          <div
            className={`hidden md:block absolute top-8 w-4 h-4 bg-accent/10 border-t border-l border-accent/30 transform ${
              isEven
                ? "right-0 translate-x-1/2 -mr-px rotate-135"
                : "left-0 -translate-x-1/2 -ml-px -rotate-45"
            }`}
          />

          {/* Company Logo and Duration */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 gap-2 sm:gap-3">
            <motion.div
              className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-accent/20 rounded-full overflow-hidden relative flex items-center justify-center border-accent border-1"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* Using placeholder for demo - replace with actual logos */}
              <div className="text-lg font-bold text-primary object-scale-down">
                <Image src={experience.logo} alt="" fill className="object-contain"/>
              </div>
            </motion.div>
            <motion.div
              className="flex flex-col sm:items-start"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-primary">
                {experience.title}
              </h3>
              <div className="text-sm sm:text-base text-text">
                {experience.company} · {experience.type}
              </div>
              <div className="text-xs sm:text-sm text-accent">
                {experience.startDate} - {experience.endDate}
              </div>
              <div className="text-xs sm:text-sm text-text">
                {experience.location}
              </div>
            </motion.div>
          </div>

          {/* Description with staggered animation */}
          <motion.p
            className="text-sm sm:text-base text-text mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {experience.description}
          </motion.p>

          {/* Skills with staggered animation */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-start">
              {experience.skills.map((skill, index) => (
                <motion.span
                  key={index}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-secondary/20 text-text rounded-md"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.8 + index * 0.05, // Staggered delay for each skill
                    duration: 0.4,
                  }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Achievements with staggered animation */}
          {experience.achievements && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <h4 className="text-base sm:text-lg font-medium text-primary mb-2">
                Key Achievements:
              </h4>
              <ul className="list-disc ml-5 text-sm sm:text-base text-text">
                {experience.achievements.map((achievement, index) => (
                  <motion.li
                    key={index}
                    className="mb-1"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 1 + index * 0.1, // Staggered delay for each achievement
                      duration: 0.5,
                    }}
                  >
                    {achievement}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Empty Space for Timeline Balance */}
      <div className="hidden md:block w-1/2" />
    </div>
  );
};

export default ExperienceCard;
