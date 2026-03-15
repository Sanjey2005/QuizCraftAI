"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, BookOpen, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  creator: string;
  question_count?: number;
}

const DIFFICULTIES = [
  { value: "", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  hard: "bg-rose-500/10 border-rose-500/20 text-rose-400",
};

function QuizCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 animate-pulse border border-white/5" style={{ background: "var(--surface-800)" }}>
      <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
      <div className="h-3.5 bg-white/5 rounded w-1/2 mb-4" />
      <div className="flex gap-2 mb-5">
        <div className="h-5 bg-white/5 rounded-full w-16" />
        <div className="h-5 bg-white/5 rounded-full w-14" />
      </div>
      <div className="h-8 bg-white/5 rounded-lg w-28" />
    </div>
  );
}

export default function QuizzesPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["quizzes", debouncedSearch, difficulty],
    queryFn: () =>
      api.get("/api/quizzes", {
        params: {
          ...(debouncedSearch && { topic: debouncedSearch }),
          ...(difficulty && { difficulty }),
        },
      }).then((r) => r.data),
  });

  let debounceTimer: ReturnType<typeof setTimeout>;
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Discover Quizzes</h1>
          <p className="text-white/40 text-sm">Browse AI-generated quizzes on any topic</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by topic..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
              style={{
                background: "var(--surface-700)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>
          <div className="flex gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  difficulty === d.value
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-white/45 border border-white/10 hover:text-white hover:bg-white/5"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <QuizCardSkeleton key={i} />)}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white font-semibold mb-1">No quizzes found</p>
            <p className="text-white/35 text-sm">Try a different topic or difficulty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quizzes/${quiz.id}`}
                className="group rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 hover:shadow-lg transition-all card-glow"
                style={{ background: "var(--surface-800)" }}
              >
                <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-2">
                  {quiz.title}
                </h3>
                <p className="text-sm text-white/35 mb-4">{quiz.topic}</p>
                <div className="flex items-center gap-2 mb-5">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize", DIFFICULTY_STYLES[quiz.difficulty])}>
                    {quiz.difficulty}
                  </span>
                  {quiz.question_count != null && (
                    <span className="text-xs text-white/25">{quiz.question_count} questions</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-400">
                  Start Quiz
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
