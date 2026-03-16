"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { storeUser, storeTokens, type User } from "@/lib/hooks";
import { GraduationCap, BookOpen, Eye, EyeOff, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const roles = [
    { value: "student" as const, icon: BookOpen, label: "Student", desc: "Take quizzes & track progress" },
    { value: "instructor" as const, icon: GraduationCap, label: "Instructor", desc: "Create & analyze quizzes" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0A0A] relative overflow-hidden">
      {/* Subtle ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[480px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 relative z-10 shadow-2xl my-8"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="w-12 h-12 rounded bg-white flex items-center justify-center mb-6">
            <Brain className="w-7 h-7 text-[#0A0A0A]" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
            Create an account
          </h1>
          <p className="text-[#A0A0A0] text-sm text-center">
            Join QuizCraft AI and transform your learning experience.
          </p>
        </div>

        {/* Role picker */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {roles.map(({ value, icon: Icon, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: value }))}
              className={`py-4 px-4 rounded-xl border text-left transition-all relative overflow-hidden group
                ${form.role === value 
                  ? "border-white bg-[#1A1A1A]" 
                  : "border-[#2A2A2A] bg-transparent hover:border-[#555555] hover:bg-[#1A1A1A]"
                }`}
            >
              <div className="relative z-10">
                <Icon className={`w-5 h-5 mb-3 transition-colors ${form.role === value ? "text-white" : "text-[#555555] group-hover:text-[#A0A0A0]"}`} />
                <p className={`text-sm font-semibold transition-colors ${form.role === value ? "text-white" : "text-[#A0A0A0]"}`}>{label}</p>
                <p className={`text-xs mt-1 transition-colors ${form.role === value ? "text-[#A0A0A0]" : "text-[#555555]"}`}>{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setErrorMsg(""); registerMutation.mutate(form); }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A0A0A0]">Username</label>
            <input 
              type="text" 
              value={form.username} 
              onChange={set("username")} 
              required 
              autoFocus
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm outline-none transition-all placeholder:text-[#555555] focus:border-white focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]"
              placeholder="coolteacher42" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A0A0A0]">Email</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={set("email")} 
              required
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm outline-none transition-all placeholder:text-[#555555] focus:border-white focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]"
              placeholder="you@university.edu" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A0A0A0]">Password</label>
            <div className="relative">
              <input 
                type={showPwd ? "text" : "password"} 
                value={form.password} 
                onChange={set("password")} 
                required
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm outline-none transition-all pr-12 placeholder:text-[#555555] focus:border-white focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]"
                placeholder="min. 8 characters" 
              />
              <button 
                type="button" 
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#A0A0A0] transition-colors"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3 text-center">
              {errorMsg}
            </motion.div>
          )}

          <Button type="submit" className="w-full mt-4" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : "Create Account"}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-[#555555]">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline underline-offset-4 transition-all">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
