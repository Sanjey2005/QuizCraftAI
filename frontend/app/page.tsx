"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";
import {
  Zap,
  BarChart2,
  Trophy,
  ArrowRight,
  Brain,
  Shield,
  CheckCircle,
  Star,
  Sparkles,
  GraduationCap,
  Clock,
  Lock,
} from "lucide-react";

/* ── Data ── */
const FEATURES = [
  {
    icon: Brain,
    gradient: "from-blue-500 to-indigo-600",
    glow: "rgba(99,102,241,0.4)",
    tag: "Llama 3.1 · NVIDIA NIM",
    title: "AI-Powered Generation",
    description:
      "Enter any topic and get a fully structured 10-question quiz in under 30 seconds. Pydantic schema validation guarantees exactly 4 choices per question.",
  },
  {
    icon: BarChart2,
    gradient: "from-cyan-500 to-blue-500",
    glow: "rgba(6,182,212,0.4)",
    tag: "Per-topic breakdown",
    title: "Deep Analytics",
    description:
      "Students see score trends, strongest and weakest topics, and an answer-by-answer review. Instructors get aggregate stats and difficulty indices.",
  },
  {
    icon: Trophy,
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.4)",
    tag: "Real-time rankings",
    title: "Live Leaderboards",
    description:
      "Gold, silver, bronze podium for every quiz. Rankings sort by score then completion speed. Students compete, instructors celebrate top performers.",
  },
  {
    icon: Shield,
    gradient: "from-emerald-500 to-teal-500",
    glow: "rgba(16,185,129,0.4)",
    tag: "Server-side scoring",
    title: "Built-in Anti-Cheat",
    description:
      "Correct answers never leave the server during an active attempt. Tab-switch detection and server-validated timers keep every attempt honest.",
  },
  {
    icon: Zap,
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.4)",
    tag: "Celery · Redis",
    title: "Async by Design",
    description:
      "Quiz generation runs in a background Celery worker with automatic retry. The UI polls status in real time — no page refresh, no blind waiting.",
  },
  {
    icon: Lock,
    gradient: "from-rose-500 to-pink-600",
    glow: "rgba(244,63,94,0.4)",
    tag: "JWT · httpOnly cookies",
    title: "Secure Auth",
    description:
      "30-minute access tokens stored in httpOnly cookies — never localStorage. Role-based access control for students and instructors enforced server-side.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: GraduationCap,
    title: "Enter a topic",
    description:
      "Type any subject — 'Calculus derivatives', 'French Revolution', 'Python async/await' — and choose difficulty.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI generates instantly",
    description:
      "Llama 3.1 on NVIDIA NIM builds a quiz in under 30 seconds. Each question has 4 choices, one correct answer, and an explanation.",
  },
  {
    number: "03",
    icon: BarChart2,
    title: "Share & analyse",
    description:
      "Publish with one click. Students take it with anti-cheat protection. You get per-topic analytics and a live leaderboard instantly.",
  },
];

const TESTIMONIALS = [
  {
    initials: "SK",
    name: "Samira K.",
    role: "CS Lecturer",
    color: "from-violet-500 to-indigo-600",
    quote:
      "I used to spend 2 hours making quiz sheets. QuizCraft AI does it in 30 seconds and the questions are actually challenging. Absolute game changer.",
    stars: 5,
  },
  {
    initials: "RM",
    name: "Rahul M.",
    role: "Hackathon Judge",
    color: "from-cyan-500 to-blue-600",
    quote:
      "The anti-cheat implementation is impressive — server-side answer storage is the right call. And the leaderboard UX is genuinely fun for students.",
    stars: 5,
  },
  {
    initials: "AJ",
    name: "Anika J.",
    role: "Student, IIT Delhi",
    color: "from-rose-500 to-pink-600",
    quote:
      "My professor uses QuizCraft for every lecture now. The topic breakdown shows me exactly where I'm weak so I know what to revise.",
    stars: 5,
  },
];

const STATS = [
  { value: "10K+", label: "Quizzes Generated" },
  { value: "<30s", label: "Avg Generation Time" },
  { value: "500+", label: "Active Instructors" },
  { value: "99.9%", label: "Uptime" },
];

/* ── Component ── */
export default function LandingPage() {
  const { scrollY } = useScroll();
  const heroRef = useRef<HTMLElement>(null);

  const blob1Y = useTransform(scrollY, [0, 900], [0, 250]);
  const blob2Y = useTransform(scrollY, [0, 900], [0, -150]);
  const blob3Y = useTransform(scrollY, [0, 900], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "var(--surface-900)" }}>

      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 glass border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover-target group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg transition-transform group-hover:scale-105">
              Q
            </div>
            <span className="text-white font-bold tracking-tight text-lg">
              QuizCraft <span className="gradient-text">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/quizzes" className="hover-target px-4 py-2 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              Browse Quizzes
            </Link>
            <Link href="#features" className="hover-target px-4 py-2 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              Features
            </Link>
            <Link href="#how-it-works" className="hover-target px-4 py-2 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              How It Works
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hover-target px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              Sign In
            </Link>
            <Link href="/register" className="hover-target btn-primary">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative px-6 lg:px-10 pt-20 pb-32 min-h-[calc(100vh-4rem)] flex items-center mesh-bg overflow-hidden">
        {/* Animated blob orbs */}
        <motion.div style={{ y: blob1Y, background: "radial-gradient(circle, #2563eb, transparent 70%)" }} className="absolute -top-40 right-0 w-[700px] h-[700px] rounded-full opacity-25 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div style={{ y: blob2Y, background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} className="absolute -bottom-20 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
        <motion.div style={{ y: blob3Y, background: "radial-gradient(circle, #06b6d4, transparent 70%)" }} className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full opacity-15 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 7, repeat: Infinity, delay: 4 }}
        />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <motion.div style={{ opacity: heroOpacity }} className="relative max-w-5xl mx-auto text-center z-10 w-full">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/30 text-blue-300 text-xs font-semibold mb-8 shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            Powered by Llama 3.1 · NVIDIA NIM · TeachEdison Hackathon 2026
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight mb-6"
          >
            Quizzes That{" "}
            <span className="gradient-text">
              Actually
            </span>
            <br />
            <span className="text-white/90">Challenge Students</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-12"
          >
            AI generates expert-level quizzes from any topic in under 30 seconds.
            Built-in anti-cheat, live leaderboards, and per-topic analytics — all in one platform.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register" className="hover-target btn-primary text-base px-8 py-4 glow-blue">
              Start for Free — No Card Needed
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/quizzes"
              className="hover-target inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass border border-white/15 text-white font-semibold text-base transition-all hover:bg-white/10 hover:-translate-y-1"
            >
              Browse Live Quizzes
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-6 text-white/30 text-sm font-medium"
          >
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" />No credit card required</div>
            <span className="w-px h-4 bg-white/15" />
            <div className="flex items-center gap-2"><Zap className="w-4 h-4" />Ready in &lt; 30 seconds</div>
            <span className="w-px h-4 bg-white/15" />
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />Anti-cheat built in</div>
            <span className="w-px h-4 bg-white/15" />
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" />Free during hackathon</div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative z-10 -mt-1 px-6 lg:px-10 py-16" style={{ background: "var(--surface-800)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-black gradient-text mb-1">{value}</p>
                <p className="text-sm text-white/40 font-medium">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-6 lg:px-10 py-32" style={{ background: "var(--surface-900)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="text-xs font-bold uppercase tracking-[0.2em] gradient-text mb-4"
            >
              Everything you need
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-white tracking-tight"
            >
              Built for real classrooms
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.2 }}
              className="text-white/40 max-w-xl mx-auto mt-4 leading-relaxed"
            >
              Every feature was designed based on pain points real instructors face every day.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, gradient, glow, tag, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl p-8 overflow-hidden gradient-border card-glow transition-all duration-300"
                style={{ background: "var(--surface-800)" }}
              >
                {/* Animated shimmer */}
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
                
                {/* Icon */}
                <div
                  className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg transition-all duration-300 group-hover:scale-110`}
                  style={{ boxShadow: `0 0 20px ${glow}` }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Tag */}
                <div className="inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/50 text-xs font-semibold mb-4 font-mono">
                  {tag}
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-6 lg:px-10 py-32" style={{ background: "var(--surface-800)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-[0.2em] gradient-text mb-4"
            >
              Simple by design
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black text-white tracking-tight"
            >
              Three steps. Under a minute.
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px"
              style={{ background: "linear-gradient(90deg, rgba(37,99,235,0.5), rgba(124,58,237,0.5), rgba(37,99,235,0.5))" }}
            />

            {STEPS.map(({ number, icon: Icon, title, description }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative z-10 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: "linear-gradient(135deg, var(--surface-700), var(--surface-600))",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.4)",
                  }}
                >
                  <Icon className="w-10 h-10 text-blue-400 transition-colors group-hover:text-violet-400" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-black">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="px-6 lg:px-10 py-32" style={{ background: "var(--surface-900)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-[0.2em] gradient-text mb-4"
            >
              Loved by educators
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-white tracking-tight"
            >
              Don&apos;t just take our word for it
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ initials, name, role, color, quote, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl p-8 gradient-border card-glow transition-all duration-300"
                style={{ background: "var(--surface-800)" }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: stars }).map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-white/70 text-sm leading-relaxed mb-8 italic">&ldquo;{quote}&rdquo;</p>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-black`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-white/40 text-xs">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-6 lg:px-10 py-24" style={{ background: "var(--surface-800)" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative shadow-2xl"
          style={{ background: "linear-gradient(135deg, #1a2a4a 0%, #0d1a38 100%)", border: "1px solid rgba(37,99,235,0.3)" }}
        >
          {/* Glowing orbs inside banner */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: "radial-gradient(circle, #2563eb, transparent 70%)" }} />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />

          <div className="relative px-8 md:px-16 py-20 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/30 text-blue-300 text-xs font-semibold mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Free during the TeachEdison Hackathon 2026
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Ready to save hours<br />every week?
            </h2>
            <p className="text-lg text-white/50 mb-12 max-w-2xl mx-auto">
              Join instructors using QuizCraft AI to generate, assign, and analyse quizzes — all in one modern platform. No credit card, no setup fees.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="hover-target btn-primary text-base px-10 py-4 glow-blue">
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/quizzes" className="hover-target inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl glass border border-white/15 text-white font-semibold text-base transition-all hover:bg-white/10 hover:-translate-y-1">
                Browse Quizzes
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "var(--surface-900)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black">
              Q
            </div>
            <div>
              <span className="text-white font-bold block">QuizCraft AI</span>
              <span className="text-white/30 text-xs">TeachEdison Hackathon 2026</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-white/35 text-sm font-medium">
            <Link href="/quizzes" className="hover-target hover:text-white transition-colors">Browse</Link>
            <Link href="/register" className="hover-target hover:text-white transition-colors">Register</Link>
            <Link href="/login" className="hover-target hover:text-white transition-colors">Sign In</Link>
          </div>

          <p className="text-white/20 text-xs text-center">
            Built with Llama 3.1 on NVIDIA NIM · Next.js · Django
          </p>
        </div>
      </footer>
    </div>
  );
}
