"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { storeUser, storeTokens, type User } from "@/lib/hooks";
import { Brain, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginData { username: string; password: string; }
interface TokenResponse { access: string; refresh: string; user: User; }

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0A0A] relative overflow-hidden">
      {/* Subtle ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-[#1A1A1A] border border-white/30 rounded-2xl p-8 relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="w-12 h-12 rounded bg-white flex items-center justify-center mb-6">
            <Brain className="w-7 h-7 text-[#0A0A0A]" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
            Welcome back
          </h1>
          <p className="text-white/80 text-sm text-center">
            Sign in to your QuizCraft AI account to continue.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setErrorMsg(""); loginMutation.mutate({ username, password }); }} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/30 rounded-lg text-white text-sm outline-none transition-all placeholder:text-white/60 focus:border-white focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-white/80">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/30 rounded-lg text-white text-sm outline-none transition-all pr-12 placeholder:text-white/60 focus:border-white focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3 text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-white/60">
          Don't have an account?{" "}
          <Link href="/register" className="text-white hover:underline underline-offset-4 transition-all">
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
