"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Make sure these match the colors from the page
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-rose-100 text-rose-800",
};

export interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description?: string;
    topic: string;
    difficulty: "easy" | "medium" | "hard" | string;
    creator: string;
    question_count?: number;
  };
  index?: number;
}

export function QuizCard({ quiz, index = 0 }: QuizCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Framer Motion 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  // Calculate rotation based on pointer position relative to element center
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates from -0.5 to 0.5
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.4, 
        ease: "easeOut" 
      }}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
      }}
      className="relative h-full select-none"
    >
      <Link href={`/quizzes/${quiz.id}/attempt`} className="block h-full outline-none group hover-target">
        {/* Glow effect behind the card */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] rounded-xl blur-xl transition-opacity duration-300 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.4 : 0 }}
        />

        <div 
          className="h-full relative bg-white border border-slate-200 rounded-xl p-6 transition-colors duration-200 overflow-hidden flex flex-col group-hover:border-[var(--color-accent)]/30"
          style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50/50 pointer-events-none" />

          <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="font-bold text-lg text-slate-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-[var(--color-brand)] transition-colors">
              {quiz.title}
            </h3>
            
            <p className="text-xs text-slate-500 mb-4 font-medium">
              by {quiz.creator}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold shadow-sm border border-slate-200/60">
                {quiz.topic}
              </span>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold capitalize shadow-sm",
                  DIFFICULTY_COLORS[quiz.difficulty] || "bg-slate-100 text-slate-700"
                )}
              >
                {quiz.difficulty}
              </span>
              {quiz.question_count && (
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-semibold shadow-sm ml-auto">
                  {quiz.question_count} Qs
                </span>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <div
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] group-hover:text-[var(--color-brand)] transition-colors"
              >
                Start Quiz 
                <motion.div
                  animate={{ x: isHovered ? 4 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
