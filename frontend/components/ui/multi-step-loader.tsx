"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const generationSteps = [
  { id: 1, text: "Analyzing topic semantics..." },
  { id: 2, text: "Generating educational content with Llama 3.1..." },
  { id: 3, text: "Validating difficulty and JSON structure..." },
  { id: 4, text: "Finalizing quiz format..." },
];

export function MultiStepLoader({ status }: { status: "pending" | "generating" | "completed" | "failed" }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Automatically cycle through steps if we are pending or generating
  useEffect(() => {
    if (status === "completed" || status === "failed") {
      setCurrentStep(generationSteps.length);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        // Stay on the second to last step until actually completed
        if (prev >= generationSteps.length - 2) return prev;
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [status]);

  if (status === "failed") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Generation Failed</h3>
        <p className="text-slate-500 text-sm">Our AI encountered an issue. Please try again.</p>
      </motion.div>
    );
  }

  return (
    <div className="py-6 space-y-8">
      {/* Central Pulsing AI Core */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-[var(--color-brand)] blur-xl"
          />
          <div className="relative w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-100 z-10">
            {status === "completed" ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-[var(--color-brand)]" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Stepped Text List */}
      <div className="space-y-4 max-w-sm mx-auto">
        {generationSteps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isPast = idx < currentStep || status === "completed";

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: isPast ? 0.6 : isActive ? 1 : 0.2,
                x: 0 
              }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-[var(--color-brand)] animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors duration-300",
                isPast ? "text-slate-500 line-through decoration-slate-300" : 
                isActive ? "text-[var(--color-brand)]" : "text-slate-300"
              )}>
                {step.text}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
