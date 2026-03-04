import { create } from 'zustand'
import type { Business, Service, BusinessHours } from '@/types/business.types'

interface BusinessState {
  business: Business | null
  services: Service[]
  hours: BusinessHours[]
  isLoading: boolean

  setBusiness: (b: Business | null) => void
  setServices: (s: Service[]) => void
  setHours:    (h: BusinessHours[]) => void
  setLoading:  (v: boolean) => void
  reset:       () => void
}

export const useBusinessStore = create<BusinessState>()(set => ({
  business:  null,
  services:  [],
  hours:     [],
  isLoading: false,

  setBusiness: b  => set({ business: b }),
  setServices: s  => set({ services: s }),
  setHours:    h  => set({ hours: h }),
  setLoading:  v  => set({ isLoading: v }),
  reset:       () => set({ business: null, services: [], hours: [] }),
}))
