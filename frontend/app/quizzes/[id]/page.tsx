"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, Clock, BarChart2, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string; title: string; topic: string; difficulty: "easy" | "medium" | "hard";
  description: string; time_limit_seconds: number | null; per_question_timer: boolean;
  max_attempts: number; is_published: boolean; created_at: string;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  hard: "bg-rose-500/10 border-rose-500/20 text-rose-400",
};

export default function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quiz, isLoading, isError } = useQuery<Quiz>({
    queryKey: ["quiz", id],
    queryFn: () => api.get<Quiz>(`/api/quizzes/${id}`).then((r) => r.data),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-900)" }}>
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
    </div>
  );

  if (isError || !quiz) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-900)" }}>
      <div className="text-center">
        <p className="text-rose-400 font-medium mb-4">Quiz not found.</p>
        <Link href="/quizzes" className="text-sm text-blue-400 underline">Back to quizzes</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper className="max-w-3xl mx-auto">
        <Link href="/quizzes" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </Link>

        <div className="rounded-2xl p-8 gradient-border" style={{ background: "var(--surface-800)" }}>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/50 rounded-full text-xs font-medium">{quiz.topic}</span>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border capitalize", DIFFICULTY_STYLES[quiz.difficulty])}>{quiz.difficulty}</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">{quiz.title}</h1>
          {quiz.description && <p className="text-white/45 text-sm mb-6 leading-relaxed">{quiz.description}</p>}

          <div className="flex flex-wrap gap-5 mb-8 text-sm text-white/35">
            {quiz.time_limit_seconds && (
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{Math.round(quiz.time_limit_seconds / 60)} min limit</div>
            )}
            {quiz.per_question_timer && (
              <div className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4" />Per-question timer</div>
            )}
            {quiz.max_attempts > 0 && (
              <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />Max {quiz.max_attempts} attempt{quiz.max_attempts !== 1 ? "s" : ""}</div>
            )}
          </div>

          <Link href={`/quizzes/${quiz.id}/attempt`} className="btn-primary">
            Start Quiz <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </PageWrapper>
    </div>
  );
}
