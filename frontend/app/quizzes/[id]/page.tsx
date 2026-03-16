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
  easy: "bg-green-50 border-green-200 text-green-700",
  medium: "bg-amber-50 border-amber-200 text-amber-700",
  hard: "bg-rose-50 border-rose-200 text-rose-700",
};

export default function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quiz, isLoading, isError } = useQuery<Quiz>({
    queryKey: ["quiz", id],
    queryFn: () => api.get<Quiz>(`/api/quizzes/${id}`).then((r) => r.data),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
    </div>
  );

  if (isError || !quiz) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-rose-600 font-medium mb-4">Quiz not found.</p>
        <Link href="/quizzes" className="text-sm text-[#2563EB] underline">Back to quizzes</Link>
      </div>
    </div>
  );

  return (
    <PageWrapper className="max-w-3xl mx-auto">
      <Link href="/quizzes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-xs font-medium">{quiz.topic}</span>
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border capitalize", DIFFICULTY_STYLES[quiz.difficulty])}>{quiz.difficulty}</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">{quiz.title}</h1>
        {quiz.description && <p className="text-slate-500 text-sm mb-6 leading-relaxed">{quiz.description}</p>}

        <div className="flex flex-wrap gap-5 mb-8 text-sm text-slate-500">
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

        <Link href={`/quizzes/${quiz.id}/attempt`} className="bg-[#2563EB] text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-[#1d4ed8] transition-all inline-flex items-center gap-2">
          Start Quiz <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </PageWrapper>
  );
}
