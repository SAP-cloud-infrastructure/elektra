import { StateCreator } from "zustand"

export interface GlobalsSlice {
  globals: {
    embedded: boolean
    urlStateKey: string
    endpoint: string | null
    actions: {
      setEmbedded: (newEmbedded: boolean) => void
      setUrlStateKey: (newUrlStateKey: string) => void
      setEndpoint: (newEndpoint: string) => void
    }
  }
}

const createGlobalsSlice: StateCreator<GlobalsSlice, [], [], GlobalsSlice> = (set, get) => ({
  globals: {
    embedded: false,
    urlStateKey: "",
    endpoint: null,

    actions: {
      setEmbedded: (newEmbedded: boolean) =>
        set((state) => ({
          globals: { ...state.globals, embedded: newEmbedded },
        })),

      setUrlStateKey: (newUrlStateKey: string) =>
        set((state) => ({
          globals: { ...state.globals, urlStateKey: newUrlStateKey },
        })),

      setEndpoint: (newEndpoint: string) =>
        set((state) => ({
          globals: { ...state.globals, endpoint: newEndpoint },
        })),
    },
  },
})

export default createGlobalsSlice
