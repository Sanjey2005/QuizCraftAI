"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Zap, BarChart3, ShieldCheck, Users, Edit3, ChevronLeft } from "lucide-react";
import { SmokeCursor } from "@/components/ui/smoke-cursor";

const ALL_FEATURES = [
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    title: "Instant Generation",
    description: "Upload any PDF or DOCX file, and our AI instantly crafts well-structured, curriculum-aligned questions with varying difficulty levels.",
  },
  {
    icon: <Brain className="w-6 h-6 text-white" />,
    title: "Smart Integrity",
    description: "Server-side scoring, randomized question order, and tab-switch monitoring ensure assessments remain fair and secure.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-white" />,
    title: "Deep Analytics",
    description: "Topic-wise breakdowns, detailed leaderboards, and performance tracking give educators actionable insights into student comprehension.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-white" />,
    title: "Secure Architecture",
    description: "Answers are never sent to the client. Real-time monitoring and strict JWT httpOnly cookie stateless authentication.",
  },
  {
    icon: <Users className="w-6 h-6 text-white" />,
    title: "Classroom System",
    description: "Create classrooms and auto-generate 6-character join codes. Organize quizzes and students intelligently.",
  },
  {
    icon: <Edit3 className="w-6 h-6 text-white" />,
    title: "Per-Question AI Editing",
    description: "Review generated quizzes and effortlessly regenerate individual questions that don't meet your standards before publishing.",
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] font-sans selection:bg-[#FFFFFF] selection:text-[#0A0A0A]">
      <SmokeCursor />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#A0A0A0] hover:text-white transition-colors mb-12">
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="mb-16 border-b border-[#2A2A2A] pb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 to-neutral-400"
            style={{ letterSpacing: "-0.04em" }}
          >
            Everything you need to teach smarter.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[#A0A0A0] text-lg max-w-2xl"
          >
            QuizCraft AI provides a comprehensive suite of AI-first tools designed to help educators create, distribute, secure, and grade assessments effortlessly.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {ALL_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="group bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 transition-all duration-300 hover:border-[#3A3A3A] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
            >
              <div className="w-12 h-12 rounded bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-6 group-hover:border-[#555555] transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>{feature.title}</h3>
              <p className="text-[#A0A0A0] leading-relaxed select-none">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
