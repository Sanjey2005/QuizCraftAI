"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { storeUser, storeTokens, type User } from "@/lib/hooks";
import { Brain, Eye, EyeOff, Loader2 } from "lucide-react";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";

interface LoginData {
  username: string;
  password: string;
}
interface TokenResponse {
  access: string;
  refresh: string;
  user: User;
}

type Step = "credentials" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState<Step>("credentials");
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);
  const pendingRole = useRef<string>("student");

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await api.post<TokenResponse>("/api/auth/token", data);
      return res.data;
    },
    onSuccess: (data) => {
      storeTokens(data.access, data.refresh);
      if (data.user) storeUser(data.user);
      pendingRole.current = data.user?.role ?? "student";

      // Trigger canvas reverse animation
      setReverseCanvasVisible(true);
      setTimeout(() => setInitialCanvasVisible(false), 50);
      setTimeout(() => setStep("success"), 1500);
      setTimeout(() => {
        router.push(
          pendingRole.current === "instructor"
            ? "/dashboard/instructor"
            : "/dashboard/student"
        );
      }, 2800);
    },
    onError: () => setErrorMsg("Invalid username or password. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="flex w-full flex-col min-h-screen bg-black relative overflow-hidden">
      {/* Canvas background layer */}
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[[255, 255, 255], [255, 255, 255]]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[[255, 255, 255], [255, 255, 255]]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.85)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-12">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
            <Brain className="w-5 h-5 text-black" />
          </div>
          <span className="text-white font-semibold tracking-tight">QuizCraft AI</span>
        </Link>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                    Welcome back
                  </h1>
                  <p className="text-lg text-white/50 font-light">
                    Sign in to your account
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider pl-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                      placeholder="Enter your username"
                      className="w-full backdrop-blur-sm text-white border border-white/15 bg-white/5 rounded-full py-3 px-5 focus:outline-none focus:border-white/40 placeholder:text-white/30 text-sm transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider pl-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        className="w-full backdrop-blur-sm text-white border border-white/15 bg-white/5 rounded-full py-3 px-5 pr-12 focus:outline-none focus:border-white/40 placeholder:text-white/30 text-sm transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        tabIndex={-1}
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 text-center pt-1"
                    >
                      {errorMsg}
                    </motion.p>
                  )}

                  <div className="pt-2">
                    <motion.button
                      type="submit"
                      disabled={loginMutation.isPending}
                      whileHover={{ scale: loginMutation.isPending ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-full bg-white text-black font-semibold py-3 hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </motion.button>
                  </div>
                </form>

                <p className="text-sm text-white/40">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                    You&apos;re in!
                  </h1>
                  <p className="text-lg text-white/50 font-light">Welcome back</p>
                </div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="py-8"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-white to-white/70 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-black"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-white/40 text-sm"
                >
                  Redirecting to your dashboard…
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
