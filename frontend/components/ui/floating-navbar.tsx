"use client";
import React, { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Brain } from "lucide-react";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current - (scrollYProgress.getPrevious() ?? 0);
      if (scrollYProgress.get() < 0.05) {
        setVisible(false);
      } else {
        setVisible(direction < 0);
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 1, y: -100 }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex max-w-fit fixed top-6 inset-x-0 mx-auto border border-[#2A2A2A] rounded-full bg-[#111111]/90 backdrop-blur-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.4)] z-[5000] pr-2 pl-6 py-2 items-center justify-center space-x-4",
          className
        )}
      >
        <Link href="/" className="flex items-center gap-2 mr-2">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-[#0A0A0A]" />
          </div>
          <span className="text-white text-sm font-semibold tracking-tight">QuizCraft</span>
        </Link>
        {navItems.map((navItem, idx) => (
          <Link
            key={idx}
            href={navItem.link}
            className="relative text-[#A0A0A0] hover:text-white transition-colors text-sm flex items-center space-x-1"
          >
            {navItem.icon && <span className="block sm:hidden">{navItem.icon}</span>}
            <span className="hidden sm:block">{navItem.name}</span>
          </Link>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <Link
            href="/login"
            className="text-[#A0A0A0] hover:text-white transition-colors text-sm px-3 py-1.5"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="relative overflow-hidden rounded-full border border-white bg-[linear-gradient(to_right,white_50%,transparent_50%)] bg-[length:200%_100%] bg-[position:100%_0] px-4 py-1.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[position:0_0] hover:text-[#0A0A0A]"
          >
            <span>Sign Up</span>
            <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
