"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, Clock, BarChart2, ChevronRight, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  time_limit_seconds: number | null;
  per_question_timer: boolean;
  max_attempts: number;
  is_published: boolean;
  created_at: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

function QuizDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className="border-b border-slate-200 px-6 py-4"
        style={{ background: "var(--color-brand)" }}
      >
        <div className="max-w-3xl mx-auto h-7 w-32 bg-white/20 rounded animate-pulse" />
      </div>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse">
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
            <div className="h-5 w-14 bg-slate-200 rounded-full" />
          </div>
          <div className="h-7 w-3/4 bg-slate-200 rounded mb-3" />
          <div className="h-4 w-full bg-slate-200 rounded mb-2" />
          <div className="h-4 w-2/3 bg-slate-200 rounded mb-8" />
          <div className="h-11 w-32 bg-slate-200 rounded-xl" />
        </div>
      </main>
    </div>
  );
}

export default function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    data: quiz,
    isLoading,
    isError,
  } = useQuery<Quiz>({
    queryKey: ["quiz", id],
    queryFn: () => api.get<Quiz>(`/api/quizzes/${id}`).then((r) => r.data),
  });

  if (isLoading) return <QuizDetailSkeleton />;

  if (isError || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">Quiz not found.</p>
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
            className="flex items-center gap-1.5 text-white/80 text-sm hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
              {quiz.topic}
            </span>
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                DIFFICULTY_COLORS[quiz.difficulty]
              )}
            >
              {quiz.difficulty}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {quiz.title}
          </h1>

          {quiz.description && (
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {quiz.description}
            </p>
          )}

          <div className="flex flex-wrap gap-5 mb-8 text-sm text-slate-500">
            {quiz.time_limit_seconds && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{Math.round(quiz.time_limit_seconds / 60)} min limit</span>
              </div>
            )}
            {quiz.per_question_timer && (
              <div className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" />
                <span>Per-question timer</span>
              </div>
            )}
            {quiz.max_attempts > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>
                  Max {quiz.max_attempts} attempt
                  {quiz.max_attempts !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/quizzes/${quiz.id}/attempt`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--color-accent)" }}
          >
            Start Quiz
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
