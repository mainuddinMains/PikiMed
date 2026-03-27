import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Region = "BD" | "US"

interface AppStore {
  region: Region
  setRegion: (r: Region) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      region: "BD",
      setRegion: (region) => set({ region }),
    }),
    {
      name: "pikimed-region",
      // Only persist the region key
      partialize: (state) => ({ region: state.region }),
    },
  ),
)
