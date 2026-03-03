import React, { createContext, useContext } from "react"
import { useStore as create } from "zustand"
import createStore, { StoreState } from "../lib/store"

type StoreApi = ReturnType<typeof createStore>

const StoreContext = createContext<StoreApi | null>(null)

const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StoreContext.Provider value={createStore()}>{children}</StoreContext.Provider>
)

const useAppStore = <T,>(selector: (state: StoreState) => T): T => {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error("useAppStore must be used within StoreProvider")
  }
  return create(store, selector)
}

// AUTH

export const useAuth = () => useAppStore((state) => state.auth)

export const useAuthData = () => useAppStore((state) => state.auth.token)

export const useAuthProject = () => useAppStore((state) => state.auth.project)

export const useAuthActions = () => useAppStore((state) => state.auth.actions)

// GLOBALS

export const useGlobalsUrlStateKey = () => useAppStore((state) => state.globals.urlStateKey)

export const useGlobalsEndpoint = () => useAppStore((state) => state.globals.endpoint)

export const useGlobalsEmbedded = () => useAppStore((state) => state.globals.embedded)

export const useGlobalsActions = () => useAppStore((state) => state.globals.actions)

export default StoreProvider
