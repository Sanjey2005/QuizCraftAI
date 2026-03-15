"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { storeUser, storeTokens, type User } from "@/lib/hooks";
import {
  ArrowRight,
  Sparkles,
  Trophy,
  BarChart2,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

interface LoginData { username: string; password: string; }
interface TokenResponse { access: string; refresh: string; user: User; }

const HERO_FEATURES = [
  { icon: Sparkles, text: "AI-generated quizzes in under 30 seconds" },
  { icon: BarChart2, text: "Per-topic analytics and score trends" },
  { icon: Trophy, text: "Live leaderboards for every quiz" },
  { icon: Shield, text: "Anti-cheat with server-side validation" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await api.post<TokenResponse>("/api/auth/token", data);
      return res.data;
    },
    onSuccess: (data) => {
      storeTokens(data.access, data.refresh);
      if (data.user) storeUser(data.user);
      const role = data.user?.role;
      router.push(role === "instructor" ? "/dashboard/instructor" : "/dashboard/student");
    },
    onError: () => setErrorMsg("Invalid username or password. Please try again."),
  });

  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface-900)" }}>
      {/* ── Left Hero Panel ── */}
      <div className="hidden lg:flex flex-col w-[55%] relative overflow-hidden mesh-bg p-12">
        {/* Animated orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none animate-float"
          style={{ background: "radial-gradient(circle, #2563eb, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none animate-float-delayed"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="absolute -inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black">Q</div>
          <span className="text-white font-bold text-lg">QuizCraft <span className="gradient-text">AI</span></span>
        </Link>

        {/* Hero text */}
        <div className="flex-1 flex flex-col justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-blue-500/30 text-blue-300 text-xs font-semibold mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Powered by Llama 3.1 · NVIDIA NIM
            </div>
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
              Welcome<br />
              <span className="gradient-text">back.</span>
            </h1>
            <p className="text-white/45 text-lg leading-relaxed mb-12 max-w-md">
              Sign in to manage your quizzes, track your students, and analyse performance in real time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="space-y-4"
          >
            {HERO_FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-white/55 text-sm font-medium">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <p className="text-white/20 text-xs z-10">TeachEdison Hackathon 2026</p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: "var(--surface-800)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black">Q</div>
            <span className="text-white font-bold text-lg">QuizCraft <span className="gradient-text">AI</span></span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Sign in</h2>
            <p className="text-white/40 text-sm">Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Create one →</Link>
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setErrorMsg(""); loginMutation.mutate({ username, password }); }} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{
                  background: "var(--surface-700)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                placeholder="your_username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all pr-12"
                  style={{
                    background: "var(--surface-700)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3"
              >
                {errorMsg}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="hover-target w-full btn-primary py-3.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
