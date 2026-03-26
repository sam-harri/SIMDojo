import { create } from "zustand"
import { fetchProfileStats, type ProfileStats } from "@/lib/actions"

interface ProfileState {
  stats: ProfileStats | null
  loading: boolean
  hydrated: boolean
  fetch: () => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  stats: null,
  loading: false,
  hydrated: false,

  fetch: async () => {
    const { hydrated } = get()
    if (!hydrated) set({ loading: true })

    try {
      const stats = await fetchProfileStats()
      set({ stats, hydrated: true, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
