"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const tabs = [
  { id: "home", label: "Home", icon: "./icons/home.svg" },
  { id: "about", label: "About", icon: "./icons/about.svg" },
  { id: "work", label: "Work", icon: "./icons/work.svg" },
  { id: "projects", label: "Projects", icon: "./icons/stats.svg" },
];

export default function Navbar() {
  const [selectedTab, setSelectedTab] = useState("home");
  const [isMobile, setIsMobile] = useState(false);

  // Set up mobile check based on window.innerWidth
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    // Check on mount
    checkMobile();

    // Add event listener to update on resize
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleTabClick = (tabId: string) => {
    document.getElementById(tabId)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px",
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setSelectedTab(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    tabs.forEach((tab) => {
      const element = document.getElementById(tab.id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="fixed top-8 left-0 w-full flex justify-center z-50 pointer-events-none">
      <motion.nav
        className="flex gap-4 h-20 p-4 justify-center backdrop-blur-xl rounded-xl shadow-lg bg-text/10 pointer-events-auto"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`relative flex items-center justify-center transition-all duration-300 rounded-lg overflow-hidden backdrop-blur-md cursor-pointer text-[#f9e2fb]
              ${
                selectedTab === tab.id
                  ? "bg-[#d2042d]/40 w-12 md:w-32 md:justify-start md:pl-4 shadow-lg"
                  : "bg-[#5e3d47]/20 w-12 hover:bg-[#5e3d47]/40"
              }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <motion.div
              animate={{ x: !isMobile && selectedTab === tab.id ? -8 : 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="[&_img]:filter [&_img]:brightness-0 [&_img]:invert">
                <Image src={tab.icon} width={24} height={24} alt={tab.label} />
              </div>
            </motion.div>

            <AnimatePresence>
              {selectedTab === tab.id && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  // Labels are hidden on mobile.
                  className="ml-4 whitespace-nowrap font-medium hidden md:inline"
                >
                  {tab.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </motion.nav>
    </div>
  );
}
