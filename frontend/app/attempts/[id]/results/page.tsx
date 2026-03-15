"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Check, X, ChevronDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ScoreHero } from "@/components/analytics/ScoreHero";
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";
import { cn } from "@/lib/utils";

interface AnswerResult {
  id: string;
  question_id: string;
  question_text: string;
  selected_choice_text: string;
  correct_choice_text: string;
  is_correct: boolean;
  time_spent_seconds: number;
  explanation: string;
}

interface AttemptResult {
  id: string;
  quiz: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent_seconds: number;
  topic_breakdown: Record<string, { correct: number; total: number }>;
  tab_switch_count: number;
  answers: AnswerResult[];
}

function AnswerCard({
  answer,
  index,
}: {
  answer: AnswerResult;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        answer.is_correct ? "border-green-200" : "border-red-200"
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
            answer.is_correct ? "bg-green-100" : "bg-red-100"
          )}
        >
          {answer.is_correct ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <X className="w-3.5 h-3.5 text-red-600" />
          )}
        </span>
        <span className="flex-1 text-sm text-slate-800 font-medium leading-snug">
          {index + 1}. {answer.question_text}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 flex-shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-3 bg-white">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
              Your answer
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                answer.is_correct ? "text-green-700" : "text-red-700"
              )}
            >
              {answer.selected_choice_text || "— Not answered"}
            </p>
          </div>

          {!answer.is_correct && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                Correct answer
              </p>
              <p className="text-sm font-medium text-green-700">
                {answer.correct_choice_text}
              </p>
            </div>
          )}

          {answer.explanation && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                Explanation
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {answer.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AttemptResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery<AttemptResult>({
    queryKey: ["attempt-results", id],
    queryFn: () =>
      api.get<AttemptResult>(`/api/attempts/${id}/results`).then((r) => r.data),
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">Could not load results.</p>
          <Link
            href="/quizzes"
            className="text-sm text-[var(--color-accent)] underline"
          >
            Back to quizzes
          </Link>
        </div>
      </div>
    );
  }

  const hasTopics =
    data.topic_breakdown && Object.keys(data.topic_breakdown).length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="border-b border-slate-200 px-6 py-4"
        style={{ background: "var(--color-brand)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/quizzes" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              Q
            </div>
            <span className="text-white font-semibold">QuizCraft AI</span>
          </Link>
          <Link
            href="/quizzes"
            className="text-white/80 text-sm hover:text-white transition-colors"
          >
            ← Discover
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Score hero */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900 text-center mb-2">
            Quiz Complete
          </h1>
          <ScoreHero
            score={data.score}
            correct={data.correct_answers}
            total={data.total_questions}
            timeSpent={data.time_spent_seconds}
          />
          {data.tab_switch_count > 0 && (
            <p className="text-center text-xs text-amber-600 mt-3">
              ⚠ {data.tab_switch_count} tab switch
              {data.tab_switch_count !== 1 ? "es" : ""} detected
            </p>
          )}
        </div>

        {/* Topic breakdown chart */}
        {hasTopics && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Topic Breakdown
            </h2>
            <TopicBreakdownChart topicBreakdown={data.topic_breakdown} />
          </div>
        )}

        {/* Answer review */}
        {data.answers.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Review Answers
            </h2>
            <div className="space-y-3">
              {data.answers.map((answer, i) => (
                <AnswerCard key={answer.id} answer={answer} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center pb-8">
          <Link
            href={`/quizzes/${data.quiz}/attempt`}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Retry Quiz
          </Link>
          <Link
            href="/quizzes"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--color-accent)" }}
          >
            Discover More
          </Link>
        </div>
      </main>
    </div>
  );
}
