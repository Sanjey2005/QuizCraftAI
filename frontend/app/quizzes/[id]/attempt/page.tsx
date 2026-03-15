"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useQuizAttemptStore } from "@/store/quizAttempt";
import { AnswerChoice } from "@/components/quiz/AnswerChoice";
import { TimerBar } from "@/components/quiz/TimerBar";
import { cn } from "@/lib/utils";

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

  const { currentQuestionIndex, answers, setCurrentQuestionIndex, setAnswer, reset } =
    useQuizAttemptStore();

  const attemptIdRef = useRef<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  // Debounce rapid tab-switch bursts to one PATCH per second
  const tabSwitchCooldown = useRef(false);

  // Reset store state on mount
  useEffect(() => {
    reset();
  }, [reset]);

  // Step 1: POST /api/attempts/ to create the attempt
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

    return () => {
      cancelled = true;
    };
  }, [quizId]);

  // Step 2: GET /api/attempts/{id}/questions/ after attempt is created
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

    return () => {
      cancelled = true;
    };
  }, [phase]);

  // Tab-switch detection: visibilitychange + blur
  const handleTabSwitch = useCallback(() => {
    if (!attemptIdRef.current || tabSwitchCooldown.current) return;
    tabSwitchCooldown.current = true;
    api
      .patch(`/api/attempts/${attemptIdRef.current}/tab-switch`)
      .catch(() => {});
    setTimeout(() => {
      tabSwitchCooldown.current = false;
    }, 1000);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) handleTabSwitch();
    };
    const onBlur = () => handleTabSwitch();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [handleTabSwitch]);

  // Submit an answer to the server (fire-and-forget)
  const submitAnswerToServer = useCallback(
    (questionId: string, choiceId: string) => {
      if (!attemptIdRef.current) return;
      const timeSpent = Math.round(
        (Date.now() - questionStartRef.current) / 1000
      );
      api
        .post(`/api/attempts/${attemptIdRef.current}/answers`, {
          question_id: questionId,
          choice_id: choiceId,
          time_spent_seconds: timeSpent,
        })
        .catch(() => {});
    },
    []
  );

  const handleChoiceSelect = (questionId: string, choiceId: string) => {
    setAnswer(questionId, choiceId);
    submitAnswerToServer(questionId, choiceId);
  };

  const advanceQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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

  // Loading states
  if (phase === "creating" || phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {phase === "creating" ? "Starting quiz…" : "Loading questions…"}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <p className="text-red-600 font-medium mb-4">{errorMsg}</p>
          <button
            onClick={() => router.push("/quizzes")}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const question = questions[currentQuestionIndex];
  const isLast = currentQuestionIndex === questions.length - 1;
  const selectedChoiceId = answers[question.id];
  const hasAnswered = !!selectedChoiceId;
  const perQuestion = attemptInfo?.per_question_timer ?? false;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--color-brand)" }}
            >
              Q
            </div>
            <span className="font-semibold text-slate-900 text-sm">
              QuizCraft AI
            </span>
          </div>
          <span className="text-slate-400 text-sm font-mono tabular-nums">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
      </header>

      {/* Overall progress bar */}
      <div className="w-full bg-slate-100" style={{ height: 3 }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: "var(--color-accent)",
          }}
        />
      </div>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {/* Per-question timer */}
          {perQuestion && (
            <div className="mb-5">
              <TimerBar
                key={`timer-${currentQuestionIndex}`}
                totalSeconds={
                  question.time_limit_seconds ?? DEFAULT_QUESTION_SECONDS
                }
                onExpire={advanceQuestion}
              />
            </div>
          )}

          {/* Topic tag */}
          {question.topic_tag && (
            <span className="inline-block mb-3 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
              {question.topic_tag}
            </span>
          )}

          {/* Question text */}
          <p className="text-slate-900 font-medium text-base mb-6 leading-relaxed">
            {question.text}
          </p>

          {/* Answer choices */}
          <div className="space-y-3 mb-6">
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

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Skip — only visible when not on last question */}
            {!isLast ? (
              <button
                onClick={advanceQuestion}
                disabled={phase === "finishing"}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                Skip
              </button>
            ) : (
              <span />
            )}

            {isLast ? (
              <button
                onClick={handleFinish}
                disabled={phase === "finishing"}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                )}
                style={{ background: "var(--color-accent)" }}
              >
                {phase === "finishing" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Finish Quiz
              </button>
            ) : (
              <button
                onClick={advanceQuestion}
                disabled={!hasAnswered || phase === "finishing"}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--color-accent)" }}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
