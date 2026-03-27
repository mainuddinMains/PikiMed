import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Region = "BD" | "US"

interface RegionState {
  region: Region | null
  setRegion: (r: Region) => void
  clearRegion: () => void
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      region: null,
      setRegion: (region) => set({ region }),
      clearRegion: () => set({ region: null }),
    }),
    {
      name: "pikimed_region",
      partialize: (state) => ({ region: state.region }),
    },
  ),
)
