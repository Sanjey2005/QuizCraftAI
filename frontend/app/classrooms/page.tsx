"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import {
  School, Plus, Users, Copy, Check, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  teacher_username: string;
  member_count: number;
  created_at: string;
  is_active?: boolean;
}

/* ── Create Classroom Modal (instructor) ─────────────────────────────────── */

function CreateClassroomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      api.post<Classroom>("/api/classrooms", data).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classrooms-list"] });
      setCreatedCode(data.code);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() });
  };

  const copyCode = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setCreatedCode(null);
    setCopied(false);
    createMutation.reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-2xl p-6 bg-[#1A1A1A] border border-white/30 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">
            {createdCode ? "Classroom Created!" : "Create Classroom"}
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-background border border-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdCode ? (
          <div className="text-center py-4">
            <p className="text-white/60 text-sm mb-4">Share this code with your students:</p>
            <div className="rounded-xl p-4 mb-4 bg-background border border-white/30">
              <p className="text-3xl font-black text-white tracking-[0.3em] font-mono">{createdCode}</p>
            </div>
            <button
              onClick={copyCode}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                copied
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-sm"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CS101 — Spring 2026"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/40 outline-none border border-white/30 bg-[#1A1A1A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the classroom..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/40 outline-none border border-white/30 bg-[#1A1A1A] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="w-full bg-[#2563EB] text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-[#1d4ed8] transition-all inline-flex items-center gap-2 text-sm justify-center disabled:opacity-40"
            >
              {createMutation.isPending ? "Creating..." : "Create Classroom"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

/* ── Join Classroom Modal (student) ──────────────────────────────────────── */

function JoinClassroomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const joinMutation = useMutation({
    mutationFn: (data: { code: string }) =>
      api.post("/api/classrooms/join", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms-list"] });
      setCode("");
      setError("");
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Failed to join classroom.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    joinMutation.mutate({ code: code.trim().toUpperCase() });
  };

  const handleClose = () => {
    setCode("");
    setError("");
    joinMutation.reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm rounded-2xl p-6 bg-[#1A1A1A] border border-white/30 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Join Classroom</h3>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-background border border-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">Classroom Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl text-center text-2xl font-black tracking-[0.3em] font-mono text-white placeholder:text-white/30 outline-none border border-white/30 bg-background focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-[#1A1A1A] transition-all"
              autoFocus
            />
          </div>
          {error && <p className="text-red-600 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={code.length < 6 || joinMutation.isPending}
            className="w-full bg-[#2563EB] text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-[#1d4ed8] transition-all inline-flex items-center gap-2 text-sm justify-center disabled:opacity-40"
          >
            {joinMutation.isPending ? "Joining..." : "Join Classroom"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function ClassroomsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (u) setRole(u.role);
  }, []);

  const isInstructor = role === "instructor";

  const { data: classrooms = [], isLoading } = useQuery<Classroom[]>({
    queryKey: ["classrooms-list"],
    queryFn: () =>
      api.get(isInstructor ? "/api/classrooms" : "/api/classrooms/my").then((r) => r.data),
    enabled: role !== null,
  });

  const deleteClassroomMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/classrooms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classrooms-list"] }),
  });

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isInstructor ? "Classrooms" : "My Classrooms"}
          </h1>
          <p className="text-white/60 text-sm mt-0.5">
            {isInstructor
              ? "Manage your classrooms and share codes with students"
              : "Classrooms you've joined"}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#2563EB] text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-[#1d4ed8] transition-all inline-flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          {isInstructor ? "Create Classroom" : "Join Classroom"}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-6 animate-pulse bg-[#1A1A1A] border border-white/30 shadow-sm">
              <div className="h-5 bg-background border border-white/10 rounded w-2/3 mb-3" />
              <div className="h-3 bg-background border border-white/10 rounded w-1/3 mb-4" />
              <div className="h-3 bg-background border border-white/10 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="rounded-xl overflow-hidden bg-[#1A1A1A] border border-white/30 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4">
              <School className="w-8 h-8 text-violet-600" />
            </div>
            <p className="text-white font-bold text-lg mb-2">
              {isInstructor ? "No classrooms yet" : "No classrooms joined"}
            </p>
            <p className="text-white/60 text-sm mb-6 max-w-xs">
              {isInstructor
                ? "Create a classroom and share the code with your students."
                : "Ask your instructor for a classroom code to get started."}
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#2563EB] text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-[#1d4ed8] transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isInstructor ? "Create Classroom" : "Join Classroom"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classrooms.map((classroom, idx) => (
            <motion.div
              key={classroom.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.04 }}
              className="rounded-xl overflow-hidden bg-[#1A1A1A] border border-white/30 shadow-sm cursor-pointer group transition-all hover:shadow-md"
              onClick={() => router.push(`/classrooms/${classroom.id}`)}
            >
              <div className="h-1 bg-gradient-to-r from-[#2563EB] to-[#1E3A5F]" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-base truncate group-hover:text-[#2563EB] transition-colors">
                      {classroom.name}
                    </p>
                    {classroom.description && (
                      <p className="text-xs text-white/60 mt-0.5 truncate">{classroom.description}</p>
                    )}
                  </div>
                  {isInstructor && (
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (confirm("Deactivate this classroom?")) deleteClassroomMutation.mutate(classroom.id);
                        }}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {isInstructor && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 bg-background border border-white/30 w-fit">
                    <span className="text-lg font-black text-white tracking-[0.2em] font-mono">{classroom.code}</span>
                    <CopyButton text={classroom.code} />
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {classroom.member_count} {isInstructor ? "student" : "member"}{classroom.member_count !== 1 ? "s" : ""}
                  </span>
                  {!isInstructor && (
                    <span>by {classroom.teacher_username}</span>
                  )}
                  <span>
                    {new Date(classroom.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isInstructor ? (
        <CreateClassroomModal open={modalOpen} onClose={() => setModalOpen(false)} />
      ) : (
        <JoinClassroomModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </PageWrapper>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="p-0.5">
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-white/40 hover:text-white/60" />
      )}
    </button>
  );
}
