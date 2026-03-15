import { create } from "zustand";

export type QuizAttemptStatus = "idle" | "active" | "complete";

interface QuizAttemptState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  offlineQueue: unknown[];
  status: QuizAttemptStatus;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswer: (questionId: string, choiceId: string) => void;
  pushOffline: (item: unknown) => void;
  clearOfflineQueue: () => void;
  setStatus: (status: QuizAttemptStatus) => void;
  reset: () => void;
}

const initialState = {
  currentQuestionIndex: 0,
  answers: {} as Record<string, string>,
  offlineQueue: [] as unknown[],
  status: "idle" as QuizAttemptStatus,
};

export const useQuizAttemptStore = create<QuizAttemptState>((set) => ({
  ...initialState,
  setCurrentQuestionIndex: (currentQuestionIndex) =>
    set({ currentQuestionIndex }),
  setAnswer: (questionId, choiceId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: choiceId },
    })),
  pushOffline: (item) =>
    set((state) => ({
      offlineQueue: [...state.offlineQueue, item],
    })),
  clearOfflineQueue: () => set({ offlineQueue: [] }),
  setStatus: (status) => set({ status }),
  reset: () => set(initialState),
}));
