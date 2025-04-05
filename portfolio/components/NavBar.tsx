"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Image from "next/image";

gsap.registerPlugin(ScrollToPlugin);

const tabs = [
  { id: "home", label: "Home", icon: "/home.svg" },
  { id: "about", label: "About", icon: "/about.svg" },
  { id: "work", label: "Work", icon: "/work.svg" },
  { id: "stats", label: "Stats", icon: "/stats.svg" },
];

export default function Navbar() {
  const [selectedTab, setSelectedTab] = useState("home");

  const handleTabClick = (tabId: string) => {
    setSelectedTab(tabId);
    gsap.to(window, { duration: 1, scrollTo: `#${tabId}` });
  };

  useEffect(() => {
    gsap.fromTo(
      ".tab",
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 }
    );
  }, []);

  // Animation for when tab changes
  useEffect(() => {
    // Animate icons sliding left when active
    gsap.to(`.tab-icon-${selectedTab}`, {
      x: -8,
      duration: 0.3,
      ease: "power2.out"
    });

    // Reset position of other icons
    tabs.forEach(tab => {
      if (tab.id !== selectedTab) {
        gsap.to(`.tab-icon-${tab.id}`, {
          x: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });

    // Fade in label
    gsap.fromTo(
      `.tab-label-${selectedTab}`,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.4, delay: 0.1 }
    );
  }, [selectedTab]);

  return (
    <div className="fixed top-8 left-0 w-full flex justify-center z-50 pointer-events-none">
      <nav className="flex gap-4 h-20 p-4 justify-center backdrop-blur-xl rounded-xl shadow-lg bg-text/10 pointer-events-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`tab relative flex items-center justify-center transition-all duration-300 rounded-lg overflow-hidden backdrop-blur-md cursor-pointer text-[#f9e2fb] ${
              selectedTab === tab.id 
                ? "bg-[#d2042d]/40 w-32 justify-start pl-4 shadow-lg" 
                : "bg-[#5e3d47]/20 w-12 hover:bg-[#5e3d47]/40"
            }`}
          >
            <div className={`tab-icon-${tab.id} relative`}>
              <div className="[&_img]:filter [&_img]:brightness-0 [&_img]:invert">
                <Image src={tab.icon} width={24} height={24} alt={tab.label} />
              </div>
            </div>
            
            {selectedTab === tab.id && (
              <span className={`tab-label-${tab.id} ml-4 whitespace-nowrap font-medium`}>
                {tab.label}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}