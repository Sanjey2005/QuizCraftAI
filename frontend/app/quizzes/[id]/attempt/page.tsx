"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
  X,
  Clock,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import { useQuizAttemptStore } from "@/store/quizAttempt";
import { AnswerChoice } from "@/components/quiz/AnswerChoice";
import { TimerBar } from "@/components/quiz/TimerBar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface Choice {
  id: string;
  text: string;
  order: number;
}
interface Question {
  id: string;
  text: string;
  order: number;
  time_limit_seconds: number | null;
  topic_tag: string;
  difficulty_score: number;
  choices: Choice[];
}
interface AttemptInfo {
  attempt_id: string;
  total_questions: number;
  time_limit_seconds: number | null;
  per_question_timer: boolean;
}
type Phase = "creating" | "loading" | "active" | "finishing" | "error";

const CHOICE_LABELS = ["A", "B", "C", "D"];
const DEFAULT_QUESTION_SECONDS = 30;

/* ── Global Timer Hook ── */
function useGlobalTimer(
  totalSeconds: number | null,
  active: boolean,
  onExpire?: () => void
) {
  const [remaining, setRemaining] = useState(totalSeconds ?? 0);
  const startRef = useRef(Date.now());
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    if (!active || totalSeconds == null) return;
    startRef.current = Date.now();
    expiredRef.current = false;
    setRemaining(totalSeconds);
    const iv = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = Math.max(0, Math.ceil(totalSeconds - elapsed));
      setRemaining(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(iv);
        onExpireRef.current?.();
      }
    }, 500);
    return () => clearInterval(iv);
  }, [totalSeconds, active]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const pct = totalSeconds ? (remaining / totalSeconds) * 100 : 100;

  return { remaining, formatted, pct };
}

/* ── Save Indicator ── */
function SaveIndicator({ status }: { status: "saved" | "saving" | "offline" }) {
  if (status === "saving") return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className={cn(
           "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold shadow-2xl border backdrop-blur-md",
           status === "saved" ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning"
        )}
      >
        {status === "saved" ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <WifiOff className="w-3.5 h-3.5" />
        )}
        {status === "saved" ? "Saved" : "Offline"}
      </motion.div>
    </div>
  );
}

/* ── Tab Switch Warning Banner ── */
function TabSwitchBanner({
  count,
  onDismiss,
}: {
  count: number;
  onDismiss: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm bg-warning text-black font-medium">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">
        Tab switch detected ({count} total). Your instructor will be notified.
      </span>
      <button
        onClick={onDismiss}
        className="p-1 rounded hover:bg-black/10 transition-colors"
        aria-label="Dismiss warning"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Page Component ── */
export default function QuizAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("creating");
  const [errorMsg, setErrorMsg] = useState("");
  const [attemptInfo, setAttemptInfo] = useState<AttemptInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">("saved");
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const {
    currentQuestionIndex,
    answers,
    setCurrentQuestionIndex,
    setAnswer,
    reset,
  } = useQuizAttemptStore();

  const attemptIdRef = useRef<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const tabSwitchCooldown = useRef(false);

  useEffect(() => {
    reset();
  }, [reset]);

  // Fetch quiz title
  useEffect(() => {
    api
      .get<{ title: string }>(`/api/quizzes/${quizId}`)
      .then((r) => setQuizTitle(r.data.title))
      .catch(() => {});
  }, [quizId]);

  // Step 1: Create attempt
  useEffect(() => {
    let cancelled = false;
    api
      .post<AttemptInfo>("/api/attempts", { quiz_id: quizId })
      .then((r) => {
        if (cancelled) return;
        attemptIdRef.current = r.data.attempt_id;
        setAttemptInfo(r.data);
        setPhase("loading");
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg("Failed to start quiz. Please try again.");
          setPhase("error");
        }
      });
    return () => { cancelled = true; };
  }, [quizId]);

  // Step 2: Load questions
  useEffect(() => {
    if (phase !== "loading" || !attemptIdRef.current) return;
    let cancelled = false;
    api
      .get<Question[]>(`/api/attempts/${attemptIdRef.current}/questions`)
      .then((r) => {
        if (cancelled) return;
        setQuestions(r.data);
        questionStartRef.current = Date.now();
        setPhase("active");
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg("Failed to load questions. Please refresh.");
          setPhase("error");
        }
      });
    return () => { cancelled = true; };
  }, [phase]);

  // Tab-switch detection
  const handleTabSwitch = useCallback(() => {
    if (!attemptIdRef.current || tabSwitchCooldown.current || phase !== "active") return;
    tabSwitchCooldown.current = true;
    setTabSwitchCount((c) => c + 1);
    setShowTabWarning(true);
    api.patch(`/api/attempts/${attemptIdRef.current}/tab-switch`).catch(() => {});
    setTimeout(() => { tabSwitchCooldown.current = false; }, 1000);
  }, [phase]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) handleTabSwitch(); };
    const onBlur = () => handleTabSwitch();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [handleTabSwitch]);

  // Submit answer
  const submitAnswerToServer = useCallback(
    (questionId: string, choiceId: string) => {
      if (!attemptIdRef.current) return;
      const timeSpent = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));
      setSaveStatus("saving");
      api
        .post(`/api/attempts/${attemptIdRef.current}/answers`, {
          question_id: questionId,
          choice_id: choiceId,
          time_spent_seconds: timeSpent,
        })
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("offline"));
    },
    []
  );

  const handleChoiceSelect = (questionId: string, choiceId: string) => {
    setAnswer(questionId, choiceId);
    submitAnswerToServer(questionId, choiceId);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length && index !== currentQuestionIndex) {
      setDirection(index > currentQuestionIndex ? 1 : -1);
      setCurrentQuestionIndex(index);
      questionStartRef.current = Date.now();
    }
  };

  const handleFinish = async () => {
    if (!attemptIdRef.current) return;
    setPhase("finishing");
    try {
      await api.post(`/api/attempts/${attemptIdRef.current}/complete`);
      router.push(`/attempts/${attemptIdRef.current}/results`);
    } catch {
      setErrorMsg("Failed to submit quiz. Please try again.");
      setPhase("active");
    }
  };

  const timer = useGlobalTimer(
    attemptInfo?.time_limit_seconds ?? null,
    phase === "active",
    handleFinish
  );

  /* ── Loading ── */
  if (phase === "creating" || phase === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-white/30 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-primary font-medium text-lg">
            {phase === "creating" ? "Initializing environment..." : "Loading questions..."}
          </p>
          <p className="text-white/60 text-sm mt-2 font-mono">Stand by</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface-2 rounded-2xl shadow-2xl border border-danger/20 p-8 text-center max-w-sm w-full mx-auto">
          <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-danger" />
          </div>
          <p className="text-primary font-bold text-xl mb-2">Something went wrong</p>
          <p className="text-white/80 text-sm mb-8">{errorMsg}</p>
          <button
            onClick={() => router.push("/quizzes")}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-black bg-white transition-all hover:bg-white/90"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const question = questions[currentQuestionIndex];
  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;
  const selectedChoiceId = answers[question.id];
  const perQuestion = attemptInfo?.per_question_timer ?? false;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const animationVariants: import("framer-motion").Variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0,
      transition: { duration: 0.2 },
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-white/20">
      {/* ── Tab Switch Warning ── */}
      <AnimatePresence>
         {showTabWarning && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
               <TabSwitchBanner count={tabSwitchCount} onDismiss={() => setShowTabWarning(false)} />
            </motion.div>
         )}
      </AnimatePresence>

      {/* ── Top Header ── */}
      <header className="bg-surface-2 border-b border-white/30 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Quiz title */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-2 border border-white/30 flex-shrink-0 font-mono font-bold text-white">
                Q
              </div>
              <h1 className="font-semibold tracking-tight text-white text-sm md:text-base truncate max-w-[150px] md:max-w-xs">
                {quizTitle}
              </h1>
            </div>

            {/* Timers & Counters */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              <span className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-2 border border-white/30 text-white/80 font-mono tracking-widest uppercase">
                {String(currentQuestionIndex + 1).padStart(2, '0')} <span className="text-white/60/50">/</span> {String(questions.length).padStart(2, '0')}
              </span>
              <span className="md:hidden text-xs font-mono font-bold text-white/80">{currentQuestionIndex + 1}/{questions.length}</span>

              {attemptInfo?.time_limit_seconds != null && (
                <div
                  className={cn(
                     "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-widest tabular-nums border",
                     timer.pct > 30 ? "bg-surface-2 border-white/30 text-white" : timer.pct > 10 ? "bg-warning/10 border-warning/30 text-warning" : "bg-danger/10 border-danger/30 text-danger animate-pulse"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {timer.formatted}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="w-full bg-surface-2 h-0.5">
          <div
            className="h-full transition-all duration-500 ease-out bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Main Canvas ── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col justify-center">
         <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
               <motion.div
                  key={currentQuestionIndex}
                  custom={direction}
                  variants={animationVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
               >
                 <div className="bg-surface-2 border border-white/30 rounded-2xl shadow-2xl p-6 md:p-10 lg:p-12 relative overflow-hidden">
                   {/* Background Gradient Glow */}
                   <div className="absolute -top-[100px] -right-[100px] w-64 h-64 bg-white/5 blur-3xl rounded-full pointer-events-none" />

                   {/* Per-question timer line */}
                   {perQuestion && (
                     <div className="mb-8">
                       <TimerBar
                         key={`timer-${currentQuestionIndex}`}
                         totalSeconds={question.time_limit_seconds ?? DEFAULT_QUESTION_SECONDS}
                         onExpire={() => {
                           if (currentQuestionIndex < questions.length - 1) {
                             goToQuestion(currentQuestionIndex + 1);
                           } else {
                             handleFinish();
                           }
                         }}
                       />
                     </div>
                   )}

                   {/* Metadata */}
                   <div className="flex items-center gap-3 mb-6">
                     {question.topic_tag && (
                       <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold bg-background text-white/60 border border-white/30">
                         {question.topic_tag}
                       </span>
                     )}
                   </div>

                   {/* Question Text */}
                   <h2 className="text-xl md:text-2xl font-medium text-white leading-snug tracking-tight mb-8">
                     {question.text}
                   </h2>

                   {/* Answers */}
                   <div className="space-y-4">
                     {question.choices.map((choice, i) => (
                       <AnswerChoice
                         key={choice.id}
                         label={CHOICE_LABELS[i] ?? String(i + 1)}
                         text={choice.text}
                         selected={selectedChoiceId === choice.id}
                         disabled={phase === "finishing"}
                         onClick={() => handleChoiceSelect(question.id, choice.id)}
                       />
                     ))}
                   </div>
                 </div>
               </motion.div>
            </AnimatePresence>
         </div>

         {/* Navigation Dots */}
         <div className="flex items-center justify-center gap-2 mt-8 flex-wrap max-w-xl mx-auto">
           {questions.map((q, i) => (
             <button
               key={q.id}
               onClick={() => goToQuestion(i)}
               className="w-2.5 h-2.5 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50"
               style={{
                 background:
                   i === currentQuestionIndex
                     ? "#FFFFFF"
                     : answers[q.id]
                       ? "rgba(255, 255, 255, 0.3)"
                       : "rgba(255, 255, 255, 0.1)",
                 transform: i === currentQuestionIndex ? "scale(1.5)" : "scale(1)",
               }}
               aria-label={`Go to question ${i + 1}`}
             />
           ))}
         </div>
         <p className="text-center text-xs text-white/60/50 font-mono tracking-widest mt-4 uppercase">
           {answeredCount} / {questions.length} Answered
         </p>
      </main>

      {/* ── Bottom Navigation Bar ── */}
      <div className="bg-surface-2 border-t border-white/30 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={isFirst || phase === "finishing"}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white/80 transition-colors disabled:opacity-20 disabled:cursor-not-allowed hover:bg-surface-2 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {isLast ? (
             <motion.button
               whileHover={{ scale: phase === "finishing" ? 1 : 1.02 }}
               whileTap={{ scale: phase === "finishing" ? 1 : 0.98 }}
               onClick={handleFinish}
               disabled={phase === "finishing"}
               className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-black bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-wait hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
             >
               {phase === "finishing" ? (
                 <Loader2 className="w-4 h-4 animate-spin text-black" />
               ) : (
                 <Send className="w-4 h-4 ml-1" />
               )}
               {phase === "finishing" ? "Submitting..." : "Submit Quiz"}
             </motion.button>
          ) : (
            <button
               onClick={() => goToQuestion(currentQuestionIndex + 1)}
               disabled={phase === "finishing"}
               className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-2 hover:text-white border border-white/30 hover:border-white/10"
             >
               <span className="hidden sm:inline">Next</span>
               <span className="sm:hidden">Next</span>
               <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
         {saveStatus !== "saving" && <SaveIndicator status={saveStatus} />}
      </AnimatePresence>
    </div>
  );
}
