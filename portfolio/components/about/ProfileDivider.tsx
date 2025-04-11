"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const ProfileDivider = () => {
  return (
    <div className="inline-flex w-full items-center my-12">
      <motion.div
        className="border border-accent w-4/5 h-0"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
      />
      <div className="relative mx-4">
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{
            duration: 1,
            delay: 0.3,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <Image
            src="/images/gourdpfp.svg"
            alt="Om Patel"
            width={64}
            height={64}
            className="rounded-full border-2 border-accent p-1"
          />
        </motion.div>
      </div>
      <motion.div
        className="border border-accent w-1/5 h-0"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
      />
    </div>
  );
};

export default ProfileDivider;
