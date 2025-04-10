import React from 'react';
import { Experience } from '../../portfolio/app/types/Experience';

interface ExperienceCardProps {
  experience: Experience;
  isEven: boolean;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience, isEven }) => {
  return (
    <div className={`mb-16 relative flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
      {/* Timeline Node */}
      <div className="absolute left-0 md:left-1/2 transform md:translate-x-[-50%] top-6 md:top-8 z-10">
        <div 
          className="w-5 h-5 rounded-full bg-primary border-4 border-background"
        />
      </div>

      {/* Content */}
      <div className={`w-full md:w-1/2 md:pr-12 md:pl-0 ${isEven ? 'md:text-right md:items-end' : 'md:text-left md:pl-12'}`}>
        <div className={`ml-8 md:ml-0 p-6 rounded-lg bg-accent/10 border border-accent/30 transition-all duration-300 hover:border-primary relative ${
          isEven ? 'md:mr-6' : 'md:ml-6'
        }`}>
          {/* Card Arrow */}
          <div className={`hidden md:block absolute top-8 w-4 h-4 bg-accent/10 border-t border-l border-accent/30 transform ${
            isEven ? 'right-0 translate-x-1/2 -mr-px rotate-135' : 'left-0 -translate-x-1/2 -ml-px -rotate-45'
          }`} />

          {/* Company Logo and Duration */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-accent/20 rounded-full overflow-hidden relative flex items-center justify-center">
              {/* Using placeholder for demo - replace with actual logos */}
              <div className="text-lg font-bold text-primary">
                {experience.company.substring(0, 2)}
              </div>
            </div>
            <div className={`flex flex-col ${isEven ? 'sm:items-end' : 'sm:items-start'}`}>
              <h3 className="text-2xl font-bold text-primary">
                {experience.title}
              </h3>
              <div className="text-text">
                {experience.company} · {experience.type}
              </div>
              <div className="text-sm text-accent">
                {experience.startDate} - {experience.endDate}
              </div>
              <div className="text-sm text-text">
                {experience.location}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-text mb-4">
            {experience.description}
          </p>

          {/* Skills */}
          <div className="mb-4">
            <div className={`flex flex-wrap gap-2 ${isEven ? 'justify-end' : 'justify-start'}`}>
              {experience.skills.map((skill, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-secondary/20 text-text rounded-md">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Achievements */}
          {experience.achievements && (
            <div>
              <h4 className="text-lg font-medium text-primary mb-2">Key Achievements:</h4>
              <ul className={`list-disc ${isEven ? 'ml-5 mr-0 text-left' : 'ml-5'} text-text`}>
                {experience.achievements.map((achievement, index) => (
                  <li key={index} className="mb-1">
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Empty Space for Timeline Balance */}
      <div className="hidden md:block w-1/2" />
    </div>
  );
};

export default ExperienceCard;