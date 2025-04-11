import React from "react";
import AnimatedHeader from "./AnimatedHeader";
import ProfileDivider from "./ProfileDivider";
import AboutContent from "./AboutContent";
import FeatureCards from "./FeatureCards";
import AnimatedSocialLinks from "./AnimatedSocialLinks";

function About() {
  return (
    <div className="min-h-screen bg-background px-8 md:px-16 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        <AnimatedHeader />
        <ProfileDivider />
        <AboutContent />
        <FeatureCards />
        <div className="flex justify-self-center">
          <AnimatedSocialLinks />
        </div>
      </div>
    </div>
  );
}

export default About;
