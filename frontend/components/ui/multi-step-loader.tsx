"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
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
        <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-danger" />
        </div>
        <h3 className="text-lg font-bold text-primary mb-2">Generation Failed</h3>
        <p className="text-secondary text-sm">Our AI encountered an issue. Please try again.</p>
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
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-white blur-2xl"
          />
          <div className="relative w-16 h-16 rounded-2xl bg-surface-2 shadow-2xl flex items-center justify-center border border-white/10 z-10">
            {status === "completed" ? (
              <CheckCircle2 className="w-8 h-8 text-success" />
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-white" />
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
                opacity: isPast ? 0.4 : isActive ? 1 : 0.2,
                x: 0 
              }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-border" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors duration-300",
                isPast ? "text-muted" : 
                isActive ? "text-white" : "text-muted/50"
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
