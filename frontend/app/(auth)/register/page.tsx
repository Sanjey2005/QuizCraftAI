"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { storeUser, storeTokens, type User } from "@/lib/hooks";
import { ArrowRight, GraduationCap, BookOpen, Eye, EyeOff, Sparkles } from "lucide-react";

interface RegisterData { username: string; email: string; password: string; role: "student" | "instructor"; }
interface TokenResponse { access: string; refresh: string; user: User; }

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterData>({ username: "", email: "", password: "", role: "student" });
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      await api.post("/api/auth/register", data);
      const tokenRes = await api.post<TokenResponse>("/api/auth/token", { username: data.username, password: data.password });
      return tokenRes.data;
    },
    onSuccess: (data) => {
      storeTokens(data.access, data.refresh);
      if (data.user) storeUser(data.user);
      router.push(data.user?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student");
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: Record<string, string | string[]> } };
      const errData = axiosErr?.response?.data;
      if (errData && typeof errData === "object") {
        const messages = Object.entries(errData).flatMap(([field, msgs]) => {
          const list = Array.isArray(msgs) ? msgs : [String(msgs)];
          return list.map((m) => field === "non_field_errors" ? m : `${field}: ${m}`);
        });
        setErrorMsg(messages.join(" · "));
      } else {
        setErrorMsg("Registration failed. Please try again.");
      }
    },
  });

  const set = (k: keyof RegisterData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all";
  const inputStyle = { background: "var(--surface-700)", border: "1px solid rgba(255,255,255,0.08)" };
  const focusProps = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; },
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = ""; },
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface-900)" }}>
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-col w-[55%] relative overflow-hidden mesh-bg p-12">
        <div className="absolute -top-40 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none animate-float"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none animate-float-delayed"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }} />

        <Link href="/" className="flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black">Q</div>
          <span className="text-white font-bold text-lg">QuizCraft <span className="gradient-text">AI</span></span>
        </Link>

        <div className="flex-1 flex flex-col justify-center z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-violet-500/30 text-violet-300 text-xs font-semibold mb-8">
              <Sparkles className="w-3 h-3" />
              Free during TeachEdison Hackathon 2026
            </div>
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
              Your classroom,<br />
              <span className="gradient-text">supercharged.</span>
            </h1>
            <p className="text-white/45 text-lg leading-relaxed max-w-md">
              Join instructors already generating expert quizzes with AI — and students who finally know exactly where they stand.
            </p>
          </motion.div>

          {/* Role cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4 mt-12"
          >
            {[
              { icon: BookOpen, title: "Students", desc: "Track progress, ace quizzes" },
              { icon: GraduationCap, title: "Instructors", desc: "Create, publish, analyse" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-2xl p-5 border border-white/10">
                <Icon className="w-6 h-6 text-blue-400 mb-3" />
                <p className="text-white font-bold text-sm mb-1">{title}</p>
                <p className="text-white/40 text-xs">{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-white/20 text-xs z-10">TeachEdison Hackathon 2026</p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto" style={{ background: "var(--surface-800)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black">Q</div>
            <span className="text-white font-bold text-lg">QuizCraft <span className="gradient-text">AI</span></span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Create account</h2>
            <p className="text-white/40 text-sm">Already have one?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign in →</Link>
            </p>
          </div>

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["student", "instructor"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: r }))}
                className={`hover-target py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  form.role === r
                    ? "border-blue-500/60 text-blue-300 bg-blue-500/10"
                    : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                }`}
                style={{ background: form.role === r ? undefined : "var(--surface-700)" }}
              >
                {r === "student" ? "👨‍🎓 Student" : "👩‍🏫 Instructor"}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setErrorMsg(""); registerMutation.mutate(form); }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Username</label>
              <input type="text" value={form.username} onChange={set("username")} required autoFocus
                className={inputCls} style={inputStyle} {...focusProps} placeholder="coolteacher42" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Email</label>
              <input type="email" value={form.email} onChange={set("email")} required
                className={inputCls} style={inputStyle} {...focusProps} placeholder="you@university.edu" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Password</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")} required
                  className={`${inputCls} pr-12`} style={inputStyle} {...focusProps} placeholder="min. 8 characters" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                {errorMsg}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="hover-target w-full btn-primary py-3.5 justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                <>Create Free Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-white/25 text-xs mt-6">
            By signing up you agree to the hackathon terms of use.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
