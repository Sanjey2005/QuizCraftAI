"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Smooth springs for trailing effect
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    // Check if device supports hover properly
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    
    setIsVisible(true);
    document.body.classList.add("custom-cursor-active");

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if we're hovering over something clickable or an explicit hover target
      const isClickable = target.closest("button, a, input, select, textarea, [role='button'], .hover-target");
      if (isClickable) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.body.classList.remove("custom-cursor-active");
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* The main solid dot */}
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 rounded-full pointer-events-none z-[9999]"
        style={{ 
          backgroundColor: "#fff", 
          boxShadow: "0 0 6px rgba(255,255,255,0.8)",
          mixBlendMode: "difference"
        }}
        animate={{
          x: mousePosition.x - 6,
          y: mousePosition.y - 6,
          scale: isHovering ? 1.4 : 1,
          opacity: 1,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
      />

      {/* The trailing hollow circle that expands on hover */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 pointer-events-none z-[9998]"
        style={{
          x: cursorX,
          y: cursorY,
          borderColor: isHovering ? "#2563eb" : "rgba(255,255,255,0.8)",
          mixBlendMode: "difference"
        }}
        animate={{
          scale: isHovering ? 1.6 : 1,
          backgroundColor: isHovering ? "rgba(37,99,235,0.1)" : "transparent",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </>
  );
}
