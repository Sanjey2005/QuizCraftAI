"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Check, X, ChevronDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ScoreHero } from "@/components/analytics/ScoreHero";
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";

interface AnswerResult { id: string; question_id: string; question_text: string; selected_choice_text: string; correct_choice_text: string; is_correct: boolean; time_spent_seconds: number; explanation: string; }
interface AttemptResult { id: string; quiz: string; score: number; total_questions: number; correct_answers: number; time_spent_seconds: number; topic_breakdown: Record<string, { correct: number; total: number }>; tab_switch_count: number; answers: AnswerResult[]; }

function AnswerCard({ answer, index }: { answer: AnswerResult; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("rounded-xl border overflow-hidden", answer.is_correct ? "border-emerald-500/20" : "border-rose-500/20")} style={{ background: "var(--surface-700)" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white/5">
        <span className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center", answer.is_correct ? "bg-emerald-500/20" : "bg-rose-500/20")}>
          {answer.is_correct ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
        </span>
        <span className="flex-1 text-sm text-white/80 font-medium leading-snug">{index + 1}. {answer.question_text}</span>
        <ChevronDown className={cn("w-4 h-4 text-white/25 flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div><p className="text-xs text-white/25 uppercase tracking-wide font-medium mb-1">Your answer</p><p className={cn("text-sm font-medium", answer.is_correct ? "text-emerald-400" : "text-rose-400")}>{answer.selected_choice_text || "— Not answered"}</p></div>
          {!answer.is_correct && <div><p className="text-xs text-white/25 uppercase tracking-wide font-medium mb-1">Correct answer</p><p className="text-sm font-medium text-emerald-400">{answer.correct_choice_text}</p></div>}
          {answer.explanation && <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}><p className="text-xs text-white/25 uppercase tracking-wide font-medium mb-1">Explanation</p><p className="text-sm text-white/55 leading-relaxed">{answer.explanation}</p></div>}
        </div>
      )}
    </div>
  );
}

export default function AttemptResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useQuery<AttemptResult>({
    queryKey: ["attempt-results", id],
    queryFn: () => api.get<AttemptResult>(`/api/attempts/${id}/results`).then((r) => r.data),
    retry: 2,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-900)" }}><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>;
  if (isError || !data) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-900)" }}><div className="text-center"><p className="text-rose-400 font-medium mb-4">Could not load results.</p><Link href="/quizzes" className="text-sm text-blue-400 underline">Back to quizzes</Link></div></div>;

  const hasTopics = data.topic_breakdown && Object.keys(data.topic_breakdown).length > 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper className="max-w-3xl mx-auto">
        <div className="space-y-6">
          <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--surface-800)" }}>
            <h1 className="text-lg font-bold text-white text-center mb-2">Quiz Complete</h1>
            <ScoreHero score={data.score} correct={data.correct_answers} total={data.total_questions} timeSpent={data.time_spent_seconds} />
            {data.tab_switch_count > 0 && <p className="text-center text-xs text-amber-400 mt-3">⚠ {data.tab_switch_count} tab switch{data.tab_switch_count !== 1 ? "es" : ""} detected</p>}
          </div>

          {hasTopics && (
            <div className="rounded-2xl p-6" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white mb-4">Topic Breakdown</h2>
              <TopicBreakdownChart topicBreakdown={data.topic_breakdown} />
            </div>
          )}

          {data.answers.length > 0 && (
            <div className="rounded-2xl p-6" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white mb-4">Review Answers</h2>
              <div className="space-y-3">{data.answers.map((a, i) => <AnswerCard key={a.id} answer={a} index={i} />)}</div>
            </div>
          )}

          <div className="flex gap-3 justify-center pb-8">
            <Link href={`/quizzes/${data.quiz}/attempt`} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5 hover:text-white transition-all">Retry Quiz</Link>
            <Link href="/quizzes" className="btn-primary text-sm">Discover More</Link>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
