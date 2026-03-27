import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface BDLocation {
  lat:       number
  lng:       number
  label:     string   // e.g. "Dhanmondi, Dhaka"
  district:  string   // e.g. "Dhaka"
  updatedAt: number   // Date.now()
}

interface BDLocationState {
  location:    BDLocation | null
  setLocation: (loc: BDLocation) => void
  clear:       () => void
}

export const useBDLocation = create<BDLocationState>()(
  persist(
    (set) => ({
      location:    null,
      setLocation: (location) => set({ location }),
      clear:       ()         => set({ location: null }),
    }),
    {
      name:       "pikimed_bd_location",
      partialize: (s) => ({ location: s.location }),
    },
  ),
)
