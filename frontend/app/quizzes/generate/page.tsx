"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";
import { Upload, X, FileText, Pickaxe, Brain, FileBox, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
    <PageWrapper className="max-w-2xl mx-auto">
      <div className="mb-10 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-16 h-16 rounded-2xl bg-surface-2 border border-white/30 mx-auto flex items-center justify-center mb-6">
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-semibold tracking-tight text-primary mb-3">
          Generate a Quiz
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white/80">
          Describe your topic or upload a document and let AI do the rest
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface-2 rounded-2xl border border-white/30 shadow-2xl overflow-hidden relative">
        {/* Animated background glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="p-8 md:p-10">
          {!generatedQuizId ? (
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Step 1: Topic */}
              <div className="relative">
                <div className="absolute -left-[45px] top-1 w-8 h-8 rounded-full bg-surface-2 border border-white/30 flex items-center justify-center text-xs font-mono text-white/80 hidden md:flex">01</div>
                <div>
                  <label className="block text-base font-medium text-primary mb-3">What is the topic?</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    placeholder="e.g. Photosynthesis, World War II, Python loops..."
                    className="w-full px-5 py-4 rounded-xl text-base text-primary placeholder:text-white/60 bg-surface-2 border border-white/30 outline-none transition-all focus:border-white/20 focus:bg-background shadow-inner"
                  />
                </div>
              </div>

              {/* Step 2: Settings */}
              <div className="relative">
                <div className="absolute -left-[45px] top-1 w-8 h-8 rounded-full bg-surface-2 border border-white/30 flex items-center justify-center text-xs font-mono text-white/80 hidden md:flex">02</div>
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-base font-medium text-primary">Number of questions</label>
                      <span className="text-sm font-mono bg-surface-2 px-3 py-1 rounded-md border border-white/30 text-white">{numQuestions}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full accent-white bg-surface-2 h-2 rounded-full appearance-none outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-2 font-mono">
                      <span>1</span><span>50</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-primary mb-3">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["easy", "medium", "hard"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          className={cn(
                            "py-3 text-sm font-medium rounded-xl transition-all capitalize border",
                            difficulty === d
                              ? "bg-white text-black border-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                              : "bg-surface-2 text-white/80 border-white/30 hover:text-white hover:border-white/10"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Source Material */}
              <div className="relative">
                <div className="absolute -left-[45px] top-1 w-8 h-8 rounded-full bg-surface-2 border border-white/30 flex items-center justify-center text-xs font-mono text-white/80 hidden md:flex">03</div>
                <div>
                  <label className="block text-base font-medium text-primary mb-3">
                    Upload source material <span className="text-white/60 font-normal">(optional)</span>
                  </label>

                  {!file ? (
                    <div
                      className={cn(
                        "relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                        dragging
                          ? "border-white bg-white/5"
                          : "border-white/30 hover:border-white/30 hover:bg-surface-2"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="absolute inset-x-0 h-full w-full bg-gradient-to-b from-transparent to-surface-2 opacity-50 pointer-events-none" />
                      <div className="flex flex-col items-center justify-center py-12 px-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-surface-2 border border-white/30 flex items-center justify-center mb-4">
                          <Upload className={cn("w-5 h-5 transition-colors", dragging ? "text-white" : "text-white/60")} />
                        </div>
                        <p className="text-base text-white/80 text-center mb-1">
                          <span className="text-white font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-white/60">PDF or DOCX, max 5MB</p>
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
                    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-2 border border-white/30 group hover:border-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-background border border-white/30 flex items-center justify-center flex-shrink-0">
                         <FileBox className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary font-medium truncate group-hover:text-white transition-colors">{file.name}</p>
                        <p className="text-xs text-white/60 mt-0.5">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="p-2 rounded-lg text-white/60 hover:text-danger hover:bg-danger/10 transition-all ml-4"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <p className="text-xs text-danger mt-3 flex items-center gap-1.5"><X className="w-3 h-3"/> {fileError}</p>
                  )}
                </div>
              </div>

              {generateMutation.isError && (
                <div className="rounded-xl p-4 bg-danger/10 border border-danger/20 text-center">
                   <p className="text-sm text-danger">Generation failed. Please try again.</p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={generateMutation.isPending || !topic}
                  className="w-full h-14 text-lg"
                  variant="premium"
                >
                  {generateMutation.isPending ? "Connecting to AI..." : "Generate Quiz"}
                </Button>
              </div>
            </form>
          ) : (
             <AnimatePresence mode="wait">
              <motion.div 
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 py-8"
               >
                <div className="text-center">
                  <h2 className="text-xl font-medium text-primary mb-2">Generating your quiz</h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/60">
                    <span className="text-white bg-surface-2 px-2 py-0.5 rounded border border-white/30 truncate max-w-[200px]">{topic}</span>
                    <span>·</span>
                    <span className="font-mono">{numQuestions}q</span>
                    <span>·</span>
                    <span className="capitalize">{difficulty}</span>
                    {file && (
                      <>
                        <span>·</span>
                        <span className="text-white/80 flex items-center gap-1"><FileText className="w-3 h-3"/> {file.name}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="py-4">
                  <MultiStepLoader status={currentStatus ?? "pending"} />
                </div>
                
                <div className="flex flex-col gap-3">
                  {currentStatus === "completed" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                       <Button
                          onClick={() => router.push(`/quizzes/${generatedQuizId}/edit`)}
                          className="w-full h-14 text-lg"
                          variant="premium"
                        >
                          Preview & Publish
                       </Button>
                    </motion.div>
                  )}
                  {currentStatus === "failed" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Button
                        onClick={() => { setGeneratedQuizId(null); generateMutation.reset(); }}
                        variant="outline"
                        className="w-full h-14"
                      >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </PageWrapper>
  );
}
