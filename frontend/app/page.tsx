"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowDown, Brain, Zap, BarChart3, ChevronRight } from "lucide-react";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { Testimonials } from "@/components/ui/testimonials-columns";
import { WorldMap } from "@/components/ui/world-map";
import { FaqsSection } from "@/components/ui/faqs-section";

export default function LandingPage() {
  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] font-sans selection:bg-[#FFFFFF] selection:text-[#0A0A0A]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full h-16 bg-[#111111]/80 backdrop-blur-md border-b border-[#2A2A2A] z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <span className="font-semibold text-lg tracking-tight">QuizCraft AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[#A0A0A0] hover:text-white transition-colors text-sm font-medium">
            Login
          </Link>
          <Link
            href="/register"
            className="relative overflow-hidden rounded-md border border-white bg-[linear-gradient(to_right,white_50%,#0A0A0A_50%)] bg-[length:200%_100%] bg-[position:100%_0] px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-[position:0_0] hover:text-[#0A0A0A]"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
        {/* Subtle background orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="z-10 text-center px-4 max-w-4xl max-auto flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-tight"
            style={{ letterSpacing: "-0.04em" }}
          >
            Generate quizzes.<br />
            <span className="text-[#A0A0A0]">Teach smarter.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-[#A0A0A0] text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Instantly transform any document into high-quality assessments using advanced AI. 
            Automated grading, deep analytics, and seamless classroom management.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="relative overflow-hidden rounded-md border border-white bg-[linear-gradient(to_right,white_50%,#0A0A0A_50%)] bg-[length:200%_100%] bg-[position:100%_0] px-6 py-3 font-medium text-white transition-all duration-300 hover:bg-[position:0_0] hover:text-[#0A0A0A] flex items-center gap-2 group"
            >
              Get Started
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#demo"
              className="px-6 py-3 font-medium text-[#A0A0A0] transition-colors hover:text-white flex items-center gap-2 border border-[#2A2A2A] rounded-md hover:border-[#3A3A3A]"
            >
              See Demo
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <ArrowDown className="w-6 h-6 text-[#555555]" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-t border-[#2A2A2A]">
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Feature 1 */}
          <motion.div 
            variants={fadeUp}
            className="group bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 transition-all duration-300 hover:border-[#3A3A3A] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
          >
            <div className="w-12 h-12 rounded bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-6 group-hover:border-[#555555] transition-colors">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 tracking-tight" style={{ letterSpacing: "-0.02em" }}>Instant Generation</h3>
            <p className="text-[#A0A0A0] leading-relaxed select-none">
              Upload any PDF or DOCX file, and our AI instantly crafts well-structured, curriculum-aligned questions with varying difficulty levels.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            variants={fadeUp}
            className="group bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 transition-all duration-300 hover:border-[#3A3A3A] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
          >
            <div className="w-12 h-12 rounded bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-6 group-hover:border-[#555555] transition-colors">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 tracking-tight" style={{ letterSpacing: "-0.02em" }}>Smart Integrity</h3>
            <p className="text-[#A0A0A0] leading-relaxed select-none">
              Server-side scoring, randomized question order, and tab-switch monitoring ensure assessments remain fair and secure.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            variants={fadeUp}
            className="group bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 transition-all duration-300 hover:border-[#3A3A3A] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
          >
            <div className="w-12 h-12 rounded bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-6 group-hover:border-[#555555] transition-colors">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 tracking-tight" style={{ letterSpacing: "-0.02em" }}>Deep Analytics</h3>
            <p className="text-[#A0A0A0] leading-relaxed select-none">
              Topic-wise breakdowns, detailed leaderboards, and performance tracking give educators actionable insights into student comprehension.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-t border-[#2A2A2A]">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.5 }}
           className="mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
            From material to assessment in seconds.
          </h2>
          <p className="text-[#A0A0A0] text-lg max-w-2xl">
            A frictionless workflow designed to save teachers hours of preparation time while delivering better results.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-12 md:space-y-20 relative before:absolute before:inset-0 before:ml-[28px] md:before:ml-[36px] before:-translate-x-px md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-[#2A2A2A] before:via-[#2A2A2A] before:to-transparent"
        >
          {[
            {
              step: "01",
              title: "Upload content",
              description: "Drop in your course materials, presentations, or study guides as PDF or DOCX files.",
            },
            {
              step: "02",
              title: "AI generation",
              description: "Our Llama 3.1 powered engine analyzes the text and creates curriculum-aligned questions.",
            },
            {
              step: "03",
              title: "Assign & review",
              description: "Publish to your classroom instantly. Students take the quiz, and you get detailed analytics.",
            }
          ].map((item, index) => (
            <motion.div key={item.step} variants={fadeUp} className="relative flex items-start gap-8 md:gap-12 w-full max-w-3xl">
              <div className="z-10 flex h-14 w-14 md:h-20 md:w-20 shrink-0 items-center justify-center rounded-full bg-[#111111] border border-[#2A2A2A] text-xl md:text-2xl font-bold text-white shadow-[0_0_0_8px_#0A0A0A]">
                {item.step}
              </div>
              <div className="pt-2 md:pt-4">
                <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight" style={{ letterSpacing: "-0.02em" }}>{item.title}</h3>
                <p className="text-[#A0A0A0] text-lg leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Logo Cloud */}
      <LogoCloud />

      {/* Testimonials */}
      <Testimonials />

      {/* World Map */}
      <section className="py-32 px-6 border-t border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
              style={{ letterSpacing: "-0.02em" }}
            >
              Used by educators worldwide.
            </h2>
            <p className="text-[#A0A0A0] text-lg max-w-2xl mx-auto">
              QuizCraft AI powers classrooms across 6 continents — wherever teachers and students need smarter assessments.
            </p>
          </motion.div>
          <WorldMap
            lineColor="#2563EB"
            dots={[
              { start: { lat: 40.7128, lng: -74.006  }, end: { lat: 51.5074,  lng: -0.1278   } }, // NY → London
              { start: { lat: 51.5074, lng: -0.1278  }, end: { lat: 28.6139,  lng: 77.209    } }, // London → New Delhi
              { start: { lat: 28.6139, lng: 77.209   }, end: { lat: -33.8688, lng: 151.2093  } }, // New Delhi → Sydney
              { start: { lat: 40.7128, lng: -74.006  }, end: { lat: -23.5505, lng: -46.6333  } }, // NY → São Paulo
              { start: { lat: -23.5505, lng: -46.6333}, end: { lat: 51.5074,  lng: -0.1278   } }, // São Paulo → London
              { start: { lat: 28.6139, lng: 77.209   }, end: { lat: 1.3521,   lng: 103.8198  } }, // New Delhi → Singapore
            ]}
          />
        </div>
      </section>

      {/* FAQ */}
      <FaqsSection />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#2A2A2A] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#555555]" />
            <span className="text-[#555555] font-medium text-sm">QuizCraft AI © 2026</span>
          </div>
          <div className="flex gap-6">
             <Link href="#" className="text-[#555555] hover:text-[#A0A0A0] transition-colors text-sm">Privacy</Link>
             <Link href="#" className="text-[#555555] hover:text-[#A0A0A0] transition-colors text-sm">Terms</Link>
             <Link href="#" className="text-[#555555] hover:text-[#A0A0A0] transition-colors text-sm">Twitter</Link>
             <Link href="#" className="text-[#555555] hover:text-[#A0A0A0] transition-colors text-sm">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
