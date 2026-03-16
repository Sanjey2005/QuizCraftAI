"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowDown, Brain, Zap, BarChart3, ChevronRight, Pencil, Star, Sparkles } from "lucide-react";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { Testimonials } from "@/components/ui/testimonials-columns";
import { WorldMap } from "@/components/ui/world-map";
import { FaqsSection } from "@/components/ui/faqs-section";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { Timeline } from "@/components/ui/timeline";
import { SmokeCursor } from "@/components/ui/smoke-cursor";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { CreativePricing, type PricingTier } from "@/components/ui/creative-pricing";

const navItems = [
  { name: "Features", link: "#features" },
  { name: "Journey", link: "#journey" },
  { name: "Pricing", link: "#pricing" },
  { name: "FAQ", link: "#faq" },
];

const timelineData = [
  {
    title: "2024 Q1",
    content: (
      <div>
        <p className="text-[#A0A0A0] text-sm md:text-base font-normal mb-4">
          Platform Architecture
        </p>
        <p className="text-[#555555] text-sm leading-relaxed">
          Built the Django + Next.js foundation with JWT auth via httpOnly cookies, PostgreSQL with UUID primary keys, and Celery task queue with Redis for async AI generation jobs.
        </p>
      </div>
    ),
  },
  {
    title: "2024 Q3",
    content: (
      <div>
        <p className="text-[#A0A0A0] text-sm md:text-base font-normal mb-4">
          AI Generation Engine
        </p>
        <p className="text-[#555555] text-sm leading-relaxed">
          Integrated NVIDIA NIM (Llama 3.1 70B) with Pydantic-enforced structured output — exactly 4 choices, exactly 1 correct answer per question. PDF and DOCX file upload support added.
        </p>
      </div>
    ),
  },
  {
    title: "2025",
    content: (
      <div>
        <p className="text-[#A0A0A0] text-sm md:text-base font-normal mb-4">
          Classroom System
        </p>
        <p className="text-[#555555] text-sm leading-relaxed">
          Launched classroom creation with auto-generated 6-char join codes, member management, role-based quiz visibility, and quiz-to-classroom assignment with M2M wiring.
        </p>
      </div>
    ),
  },
  {
    title: "2026",
    content: (
      <div>
        <p className="text-[#A0A0A0] text-sm md:text-base font-normal mb-4">
          TeachEdison Hackathon Launch
        </p>
        <p className="text-[#555555] text-sm leading-relaxed">
          Full platform shipped: server-side scoring, tab-switch integrity monitoring, topic-wise analytics, leaderboards, availability windows, and per-question AI regeneration.
        </p>
        <div className="mt-4 space-y-1.5">
          {[
            "Server-side scoring — answers never sent to client",
            "Tab-switch monitoring for assessment integrity",
            "Topic breakdown analytics & leaderboards",
            "Quiz availability windows (scheduled / always-on)",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[#555555] text-sm">
              <span className="text-green-500">✓</span> {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const quizCraftTiers: PricingTier[] = [
  {
    name: "Starter",
    icon: <Pencil className="w-6 h-6" />,
    price: 0,
    description: "For individual educators",
    color: "amber",
    features: [
      "5 AI quizzes/month",
      "1 classroom",
      "Basic analytics",
      "PDF upload",
    ],
  },
  {
    name: "Pro",
    icon: <Star className="w-6 h-6" />,
    price: 499,
    description: "For active teachers",
    color: "blue",
    features: [
      "Unlimited quizzes",
      "10 classrooms",
      "Advanced analytics",
      "PDF + DOCX upload",
    ],
    popular: true,
  },
  {
    name: "School",
    icon: <Sparkles className="w-6 h-6" />,
    price: 1499,
    description: "For institutions",
    color: "purple",
    features: [
      "Unlimited everything",
      "Priority AI generation",
      "Custom branding",
      "Dedicated support",
    ],
  },
];

export default function LandingPage() {
  const [loaded, setLoaded] = useState(false);
  const handleDone = useCallback(() => setLoaded(true), []);

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <>
      {/* Loading screen */}
      <LoadingScreen onDone={handleDone} />

      {/* Smoke cursor — global mouse effect */}
      <SmokeCursor />

      {/* Floating navbar — appears on scroll up */}
      <FloatingNav navItems={navItems} />

      <AnimatePresence>
        {loaded && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] font-sans selection:bg-[#FFFFFF] selection:text-[#0A0A0A]"
          >
            {/* Hero Section — Spline 3D */}
            <section className="relative min-h-screen overflow-hidden bg-black/[0.96]">
              <Spotlight
                className="-top-40 left-0 md:left-60 md:-top-20"
                fill="white"
              />
              <div className="flex h-[calc(100vh-4rem)] items-center">
                {/* Left content */}
                <div className="flex-1 p-8 md:p-16 relative z-10 flex flex-col justify-center max-w-2xl">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
                    style={{ letterSpacing: "-0.04em" }}
                  >
                    Generate quizzes.<br />
                    <span className="text-[#A0A0A0]">Teach smarter.</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                    className="text-[#A0A0A0] text-lg md:text-xl max-w-lg mb-10"
                  >
                    Instantly transform any document into high-quality assessments using advanced AI.
                    Automated grading, deep analytics, and seamless classroom management.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row items-start gap-4"
                  >
                    <Link
                      href="/register"
                      className="relative overflow-hidden rounded-md border border-white bg-[linear-gradient(to_right,white_50%,#0A0A0A_50%)] bg-[length:200%_100%] bg-[position:100%_0] px-6 py-3 font-medium text-white transition-all duration-300 hover:bg-[position:0_0] hover:text-[#0A0A0A] flex items-center gap-2 group"
                    >
                      Get Started
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="#features"
                      className="px-6 py-3 font-medium text-[#A0A0A0] transition-colors hover:text-white flex items-center gap-2 border border-[#2A2A2A] rounded-md hover:border-[#3A3A3A]"
                    >
                      See Features
                    </Link>
                  </motion.div>
                </div>

                {/* Right — 3D Spline scene */}
                <div className="flex-1 relative h-full hidden md:block">
                  <SplineScene
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
              >
                <ArrowDown className="w-6 h-6 text-[#555555]" />
              </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 px-6 max-w-7xl mx-auto border-t border-[#2A2A2A]">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
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

            {/* Timeline / Journey Section */}
            <section id="journey" className="border-t border-[#2A2A2A]">
              <div className="py-20 px-6 max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
                    How we got here.
                  </h2>
                  <p className="text-[#A0A0A0] text-lg max-w-2xl">
                    From a simple idea to a full-featured AI assessment platform.
                  </p>
                </motion.div>
              </div>
              <Timeline data={timelineData} />
            </section>

            {/* Logo Cloud */}
            <LogoCloud />

            {/* Testimonials */}
            <Testimonials />

            {/* Pricing Section */}
            <section id="pricing" className="py-32 px-6 border-t border-[#2A2A2A]">
              <CreativePricing
                tag="Simple Pricing"
                title="Plans for every classroom"
                description="Start free, scale as you grow"
                tiers={quizCraftTiers}
              />
            </section>

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
                    { start: { lat: 40.7128, lng: -74.006 }, end: { lat: 51.5074, lng: -0.1278 } },
                    { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 28.6139, lng: 77.209 } },
                    { start: { lat: 28.6139, lng: 77.209 }, end: { lat: -33.8688, lng: 151.2093 } },
                    { start: { lat: 40.7128, lng: -74.006 }, end: { lat: -23.5505, lng: -46.6333 } },
                    { start: { lat: -23.5505, lng: -46.6333 }, end: { lat: 51.5074, lng: -0.1278 } },
                    { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 1.3521, lng: 103.8198 } },
                  ]}
                />
              </div>
            </section>

            {/* FAQ */}
            <div id="faq">
              <FaqsSection />
            </div>

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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
