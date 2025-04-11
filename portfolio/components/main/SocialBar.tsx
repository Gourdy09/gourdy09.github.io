"use client";
import React from "react";
import { motion } from "framer-motion";
import AnimatedSocialLinks from "../about/AnimatedSocialLinks";

export default function SocialBar() {
  return (
    <div className="flex flex-col sm:flex-row border-t border-b border-accent w-full w-screen items-center justify-between py-4 sm:h-24 gap-4 sm:gap-12 px-4 sm:px-12">
      <motion.div
        className="flex flex-row items-center justify-center sm:justify-start text-center sm:text-left py-2 sm:py-0 h-auto sm:h-24"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h4 className="text-text text-sm sm:text-base">
          // I do things <br className="hidden sm:block" /> sometimes
        </h4>
      </motion.div>

      <AnimatedSocialLinks />
    </div>
  );
}
