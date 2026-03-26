import { create } from "zustand"
import { fetchProblems, type ProblemItem } from "@/lib/actions"

interface ProblemsState {
  problems: ProblemItem[]
  loading: boolean
  hydrated: boolean
  fetch: () => Promise<void>
}

export const useProblemsStore = create<ProblemsState>((set, get) => ({
  problems: [],
  loading: false,
  hydrated: false,

  fetch: async () => {
    // If we already have data, show it instantly and refresh in background
    const { hydrated } = get()
    if (!hydrated) set({ loading: true })

    try {
      const problems = await fetchProblems()
      set({ problems, hydrated: true, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
