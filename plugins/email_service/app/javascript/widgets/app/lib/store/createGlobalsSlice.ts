import { StateCreator } from "zustand"

export interface GlobalsSlice {
  globals: {
    embedded: boolean
    urlStateKey: string
    endpoint: string | null
    cronusEndpoint: string | null
    actions: {
      setEmbedded: (newEmbedded: boolean) => void
      setUrlStateKey: (newUrlStateKey: string) => void
      setEndpoint: (newEndpoint: string) => void
      setCronusEndpoint: (v: string) => void
    }
  }
}

const createGlobalsSlice: StateCreator<GlobalsSlice, [], [], GlobalsSlice> = (set) => ({
  globals: {
    embedded: false,
    urlStateKey: "",
    endpoint: null,
    cronusEndpoint: null,

    actions: {
      setEmbedded: (newEmbedded: boolean) =>
        set((state) => ({ globals: { ...state.globals, embedded: newEmbedded } })),
      setUrlStateKey: (newUrlStateKey: string) =>
        set((state) => ({ globals: { ...state.globals, urlStateKey: newUrlStateKey } })),
      setEndpoint: (newEndpoint: string) =>
        set((state) => ({ globals: { ...state.globals, endpoint: newEndpoint } })),
      setCronusEndpoint: (v: string) =>
        set((state) => ({ globals: { ...state.globals, cronusEndpoint: v } })),
    },
  },
})

export default createGlobalsSlice
