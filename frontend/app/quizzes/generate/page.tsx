"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";
import { Upload, X, FileText } from "lucide-react";

interface StatusResponse {
  id: string;
  generation_status: "pending" | "generating" | "completed" | "failed";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function GenerateQuizPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generatedQuizId, setGeneratedQuizId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) router.push("/login");
    else if (user.role !== "instructor") router.push("/quizzes");
  }, [router]);

  const generateMutation = useMutation({
    mutationFn: async (data: { topic: string; num_questions: number; difficulty: string; file: File | null }) => {
      if (data.file) {
        const formData = new FormData();
        formData.append("topic", data.topic);
        formData.append("num_questions", String(data.num_questions));
        formData.append("difficulty", data.difficulty);
        formData.append("file", data.file);
        const res = await api.post<{ quiz_id: string }>("/api/quizzes/generate", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      } else {
        const res = await api.post<{ quiz_id: string }>("/api/quizzes/generate", {
          topic: data.topic,
          num_questions: data.num_questions,
          difficulty: data.difficulty,
        });
        return res.data;
      }
    },
    onSuccess: (data) => setGeneratedQuizId(data.quiz_id),
  });

  const { data: statusData } = useQuery<StatusResponse>({
    queryKey: ["quiz-status", generatedQuizId],
    queryFn: () => api.get<StatusResponse>(`/api/quizzes/${generatedQuizId}/status`).then((r) => r.data),
    enabled: !!generatedQuizId,
    refetchInterval: (query) => {
      const s = query.state.data?.generation_status;
      if (s === "completed" || s === "failed") return false;
      return 3000;
    },
  });

  const currentStatus = statusData?.generation_status;

  const handleFile = (f: File | null) => {
    setFileError("");
    if (!f) { setFile(null); return; }
    const ext = f.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".docx")) {
      setFileError("Only .pdf and .docx files are accepted.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("File is too large. Maximum size is 5MB.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratedQuizId(null);
    generateMutation.mutate({ topic, num_questions: numQuestions, difficulty, file });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Generate a Quiz</h1>
          <p className="text-white/40 text-sm">Describe your topic and let AI do the rest</p>
        </div>

        <div
          className="rounded-2xl p-8 gradient-border"
          style={{ background: "var(--surface-800)" }}
        >
          {!generatedQuizId ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder="e.g. Photosynthesis, World War II, Python loops..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                  style={{ background: "var(--surface-700)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">
                  Upload source material <span className="font-normal text-white/30">(optional)</span>
                </label>

                {!file ? (
                  <div
                    className={cn(
                      "relative rounded-xl border-2 border-dashed transition-all cursor-pointer",
                      dragging
                        ? "border-blue-500/50 bg-blue-500/5"
                        : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <Upload className={cn("w-8 h-8 mb-3", dragging ? "text-blue-400" : "text-white/20")} />
                      <p className="text-sm text-white/40 text-center">
                        <span className="text-blue-400 font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-white/20 mt-1">PDF or DOCX, max 5MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "var(--surface-700)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{file.name}</p>
                      <p className="text-xs text-white/30">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {fileError && (
                  <p className="text-xs text-rose-400 mt-2">{fileError}</p>
                )}
                <p className="text-xs text-white/20 mt-2">AI will generate questions based on your document</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-white/60">Number of questions</label>
                  <span className="text-sm font-black font-mono text-blue-400">{numQuestions}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-white/25 mt-1">
                  <span>1</span><span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Difficulty</label>
                <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--surface-700)" }}>
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize",
                        difficulty === d
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-white/35 hover:text-white/60"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {generateMutation.isError && (
                <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  Generation failed. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="w-full btn-primary py-3.5 justify-center disabled:opacity-50"
              >
                {generateMutation.isPending ? "Submitting..." : "Generate Quiz ✦"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-bold text-white mb-1">Generating your quiz</h2>
                <p className="text-sm text-white/40">
                  <span className="text-white/70 font-medium">{topic}</span> · {numQuestions} questions · {difficulty}
                  {file && <span className="text-blue-400/60"> · from {file.name}</span>}
                </p>
              </div>
              <div className="pt-2">
                <MultiStepLoader status={currentStatus ?? "pending"} />
              </div>
              {currentStatus === "completed" && (
                <button
                  onClick={() => router.push(`/quizzes/${generatedQuizId}/edit`)}
                  className="w-full btn-primary py-3.5 justify-center"
                >
                  Preview &amp; Publish →
                </button>
              )}
              {currentStatus === "failed" && (
                <button
                  onClick={() => { setGeneratedQuizId(null); generateMutation.reset(); }}
                  className="w-full py-2.5 text-sm font-semibold text-white/50 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
