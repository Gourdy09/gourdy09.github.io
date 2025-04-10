import React from 'react';
import ExperienceCard from './ExperienceCard';
import { Experience } from '../../portfolio/app/types/Experience';

// Demo experiences data - you can replace with your actual experiences
const experiencesData: Experience[] = [
  {
    id: 1,
    title: "Machine Learning Engineer",
    company: "Tech Innovations Inc.",
    location: "Houston, TX",
    type: "Full-time",
    startDate: "June 2023",
    endDate: "Present",
    description: "Leading the development of computer vision algorithms for autonomous systems. Improved object detection accuracy by 23% using custom transformer-based architectures.",
    skills: ["PyTorch", "TensorFlow", "Computer Vision", "Deep Learning"],
    achievements: [
      "Deployed 3 major ML models to production, serving 50,000+ daily users",
      "Reduced inference time by 35% through model optimization techniques",
      "Collaborated with cross-functional teams to integrate ML capabilities into existing product lines"
    ],
    logo: "/companies/tech-innovations.png"
  },
  {
    id: 2,
    title: "Robotics Research Assistant",
    company: "University Research Lab",
    location: "Houston, TX",
    type: "Part-time",
    startDate: "January 2022",
    endDate: "May 2023",
    description: "Conducted research on robotic manipulation using reinforcement learning techniques. Developed novel algorithms for grasping irregular objects.",
    skills: ["ROS", "Python", "Reinforcement Learning", "C++"],
    achievements: [
      "Published 2 papers in top-tier robotics conferences",
      "Created an open-source library for robotic arm control",
      "Mentored 5 undergraduate students on robotics projects"
    ],
    logo: "/companies/university.png"
  },
  {
    id: 3,
    title: "Software Engineering Intern",
    company: "StartupCo",
    location: "Remote",
    type: "Internship",
    startDate: "May 2021",
    endDate: "August 2021",
    description: "Developed and maintained web applications using React and Node.js. Implemented real-time data visualization dashboard for analytics.",
    skills: ["React", "Node.js", "TypeScript", "MongoDB"],
    achievements: [
      "Built a dashboard that reduced reporting time by 75%",
      "Implemented automated testing that caught 15+ critical bugs",
      "Contributed to the team's adoption of TypeScript and modern development practices"
    ],
    logo: "/companies/startupco.png"
  }
];

const ExperienceSection = () => {
  return (
    <div className="min-h-screen bg-background px-8 md:px-16 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Experience Header */}
        <div 
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Experience</h2>
          <p className="text-text text-lg">
            // My professional journey and contributions
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div 
            className="absolute left-0 md:left-1/2 transform md:translate-x-[-50%] w-px h-full bg-accent"
          />

          {/* Experience Cards */}
          <div className="relative">
            {experiencesData.map((experience, index) => (
              <div
                key={experience.id}
              >
                <ExperienceCard 
                  experience={experience} 
                  isEven={index % 2 === 0} 
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