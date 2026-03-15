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
    <div className="fixed bottom-6 right-6 z-30">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-md border"
        style={{
          background: status === "saved" ? "#f0fdf4" : "#fffbeb",
          borderColor: status === "saved" ? "#bbf7d0" : "#fde68a",
          color: status === "saved" ? "#166534" : "#92400e",
        }}
      >
        {status === "saved" ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <WifiOff className="w-3.5 h-3.5" />
        )}
        {status === "saved" ? "Saved" : "Offline"}
      </div>
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
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={{ background: "#fef9c3", color: "#854d0e" }}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">
        Tab switch detected ({count} total). Your instructor will be notified.
      </span>
      <button
        onClick={onDismiss}
        className="p-1 rounded hover:bg-yellow-300/40 transition-colors"
        aria-label="Dismiss warning"
      >
        <X className="w-3.5 h-3.5" />
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
    if (!attemptIdRef.current || tabSwitchCooldown.current) return;
    tabSwitchCooldown.current = true;
    setTabSwitchCount((c) => c + 1);
    setShowTabWarning(true);
    api.patch(`/api/attempts/${attemptIdRef.current}/tab-switch`).catch(() => {});
    setTimeout(() => { tabSwitchCooldown.current = false; }, 1000);
  }, []);

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
      const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
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
    if (index >= 0 && index < questions.length) {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#1E3A5F" }}
          >
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-slate-600 font-medium text-sm">
            {phase === "creating" ? "Starting quiz…" : "Loading questions…"}
          </p>
          <p className="text-slate-400 text-xs mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-sm mx-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-slate-800 font-semibold mb-2">Something went wrong</p>
          <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push("/quizzes")}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#1E3A5F" }}
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
  const hasAnswered = !!selectedChoiceId;
  const perQuestion = attemptInfo?.per_question_timer ?? false;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Tab Switch Warning ── */}
      <TabSwitchBanner
        count={showTabWarning ? tabSwitchCount : 0}
        onDismiss={() => setShowTabWarning(false)}
      />

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Quiz title */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "#1E3A5F" }}
              >
                Q
              </div>
              <h1
                className="font-semibold text-sm truncate"
                style={{ color: "#1E3A5F" }}
              >
                {quizTitle}
              </h1>
            </div>

            {/* Question pill + timer */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#eff6ff", color: "#2563EB" }}
              >
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>

              {attemptInfo?.time_limit_seconds != null && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold tabular-nums"
                  style={{
                    background:
                      timer.pct > 30
                        ? "#f0fdf4"
                        : timer.pct > 10
                          ? "#fffbeb"
                          : "#fef2f2",
                    color:
                      timer.pct > 30
                        ? "#166534"
                        : timer.pct > 10
                          ? "#92400e"
                          : "#991b1b",
                  }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {timer.formatted}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="w-full bg-slate-100" style={{ height: 3 }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: "#2563EB" }}
          />
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Question Card */}
        <div
          className="bg-white border border-slate-200 p-6 sm:p-8"
          style={{ borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          {/* Per-question timer */}
          {perQuestion && (
            <div className="mb-6">
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

          {/* Topic tag + difficulty */}
          <div className="flex items-center gap-2 mb-4">
            {question.topic_tag && (
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                style={{ background: "#f1f5f9", color: "#64748b" }}
              >
                {question.topic_tag}
              </span>
            )}
          </div>

          {/* Question text */}
          <p
            className="text-slate-900 leading-relaxed mb-6"
            style={{ fontSize: 18, fontWeight: 600 }}
          >
            {question.text}
          </p>

          {/* Answer choices */}
          <div className="space-y-3">
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

        {/* Question dots — quick navigation */}
        <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => goToQuestion(i)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background:
                  i === currentQuestionIndex
                    ? "#2563EB"
                    : answers[q.id]
                      ? "#1E3A5F"
                      : "#cbd5e1",
                transform: i === currentQuestionIndex ? "scale(1.4)" : "scale(1)",
              }}
              aria-label={`Go to question ${i + 1}`}
            />
          ))}
        </div>

        {/* Answered count */}
        <p className="text-center text-xs text-slate-400 mt-3">
          {answeredCount} of {questions.length} answered
        </p>
      </main>

      {/* ── Bottom Bar ── */}
      <div className="bg-white border-t border-slate-200 sticky bottom-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Previous (ghost) */}
          <button
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={isFirst || phase === "finishing"}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => {
              if (!isFirst) (e.currentTarget.style.background = "#f1f5f9");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Next / Finish (filled) */}
          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={phase === "finishing"}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563EB" }}
            >
              {phase === "finishing" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Finish Quiz
            </button>
          ) : (
            <button
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
              disabled={phase === "finishing"}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "#2563EB" }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Save Indicator ── */}
      <SaveIndicator status={saveStatus} />
    </div>
  );
}
