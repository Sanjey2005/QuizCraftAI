"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { storeUser, storeTokens, type User } from "@/lib/hooks";
import { GraduationCap, BookOpen, Brain, Eye, EyeOff, Loader2 } from "lucide-react";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: "student" | "instructor";
}
interface TokenResponse {
  access: string;
  refresh: string;
  user: User;
}

type Step = "role" | "details" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [form, setForm] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
    role: "student",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);
  const pendingRole = useRef<string>("student");

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      await api.post("/api/auth/register", data);
      const tokenRes = await api.post<TokenResponse>("/api/auth/token", {
        username: data.username,
        password: data.password,
      });
      return tokenRes.data;
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
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: Record<string, string | string[]> } };
      const errData = axiosErr?.response?.data;
      if (errData && typeof errData === "object") {
        const messages = Object.entries(errData).flatMap(([field, msgs]) => {
          const list = Array.isArray(msgs) ? msgs : [String(msgs)];
          return list.map((m) =>
            field === "non_field_errors" ? m : `${field}: ${m}`
          );
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
    {
      value: "student" as const,
      icon: BookOpen,
      label: "Student",
      desc: "Take quizzes & track progress",
    },
    {
      value: "instructor" as const,
      icon: GraduationCap,
      label: "Instructor",
      desc: "Create & analyze quizzes",
    },
  ];

  // Slide direction: role→details goes right-to-left; back goes left-to-right
  const slideVariants = {
    enterFromRight: { opacity: 0, x: 100 },
    enterFromLeft: { opacity: 0, x: -100 },
    center: { opacity: 1, x: 0 },
    exitToLeft: { opacity: 0, x: -100 },
    exitToRight: { opacity: 0, x: 100 },
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

        <div className="w-full max-w-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1: Role selection */}
            {step === "role" && (
              <motion.div
                key="role"
                initial="enterFromLeft"
                animate="center"
                exit="exitToLeft"
                variants={slideVariants}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                    Create account
                  </h1>
                  <p className="text-lg text-white/50 font-light">
                    Who are you joining as?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {roles.map(({ value, icon: Icon, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: value }))}
                      className={`py-5 px-4 rounded-2xl border text-left transition-all group ${
                        form.role === value
                          ? "border-white/60 bg-white/10"
                          : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mb-3 transition-colors ${
                          form.role === value
                            ? "text-white"
                            : "text-white/50 group-hover:text-white/70"
                        }`}
                      />
                      <p
                        className={`text-sm font-semibold transition-colors ${
                          form.role === value ? "text-white" : "text-white/70"
                        }`}
                      >
                        {label}
                      </p>
                      <p
                        className={`text-xs mt-1 transition-colors ${
                          form.role === value ? "text-white/60" : "text-white/40"
                        }`}
                      >
                        {desc}
                      </p>
                    </button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("details")}
                  className="w-full rounded-full bg-white text-black font-semibold py-3 hover:bg-white/90 transition-colors"
                >
                  Continue
                </motion.button>

                <p className="text-sm text-white/40">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* Step 2: Account details */}
            {step === "details" && (
              <motion.div
                key="details"
                initial="enterFromRight"
                animate="center"
                exit="exitToRight"
                variants={slideVariants}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                    Your details
                  </h1>
                  <p className="text-lg text-white/50 font-light">
                    Joining as{" "}
                    <span className="text-white/80 capitalize">{form.role}</span>
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setErrorMsg("");
                    registerMutation.mutate(form);
                  }}
                  className="space-y-3 text-left"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider pl-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={set("username")}
                      required
                      autoFocus
                      placeholder="coolteacher42"
                      className="w-full backdrop-blur-sm text-white border border-white/15 bg-white/5 rounded-full py-3 px-5 focus:outline-none focus:border-white/40 placeholder:text-white/30 text-sm transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider pl-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      required
                      placeholder="you@university.edu"
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
                        value={form.password}
                        onChange={set("password")}
                        required
                        placeholder="min. 8 characters"
                        className="w-full backdrop-blur-sm text-white border border-white/15 bg-white/5 rounded-full py-3 px-5 pr-12 focus:outline-none focus:border-white/40 placeholder:text-white/30 text-sm transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        tabIndex={-1}
                      >
                        {showPwd ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
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

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      type="button"
                      onClick={() => {
                        setErrorMsg("");
                        setStep("role");
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-full bg-white text-black font-medium px-6 py-3 hover:bg-white/90 transition-colors w-[35%]"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={registerMutation.isPending}
                      whileHover={{ scale: registerMutation.isPending ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 rounded-full bg-white text-black font-semibold py-3 hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating…
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
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
                  <p className="text-lg text-white/50 font-light">
                    Welcome to QuizCraft AI
                  </p>
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
                  Setting up your dashboard…
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
