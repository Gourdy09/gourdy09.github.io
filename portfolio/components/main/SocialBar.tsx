"use client";
import React from "react";
import { motion } from "framer-motion";
import AnimatedSocialLinks from "../about/AnimatedSocialLinks";

export default function SocialBar() {
  return (
    <div className="flex flex-row border-t border-b border-accent w-screen items-center justify-between h-24 gap-12 px-12">
      <motion.div
        className="flex flex-row items-center h-24"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h4 className="text-text">
          // I do things <br /> sometimes
        </h4>
      </motion.div>

      <AnimatedSocialLinks />
    </div>
  );
}
