import React, { createContext, useContext } from "react"
import { useStore as create } from "zustand"
import createStore from "../lib/store"

const StoreContext = createContext()
const StoreProvider = ({ children }) => (
  <StoreContext.Provider value={createStore()}>
    {children}
  </StoreContext.Provider>
)

const useAppStore = (selector) => create(useContext(StoreContext), selector)


// AUTH

export const useAuth =  () =>  useAppStore((state) => state.auth)

// export const useGlobalsLoggedIn = () =>  useAppStore((state) => state.globals.loggedIn)

// export const useGlobalsLogout = () =>  useAppStore((state) => state.globals.logout)

// export const useGlobalsLogin = () =>  useAppStore((state) => state.globals.login)

export const useAuthData = () => useAppStore((state) => state.auth.token)

export const useAuthProject = () => useAppStore((state) => state.auth.project)

export const useAuthIsProcessing = () => useAppStore((state) => state.auth.isProcessing)

export const useAuthLoggedIn = () => useAppStore((state) => state.auth.loggedIn)

export const useAuthError = () => useAppStore((state) => state.auth.error)

export const useAuthLastAction = () =>  useAppStore((state) => state.auth.lastAction)

export const useAuthAppLoaded = () => useAppStore((state) => state.auth.appLoaded)

export const useAuthAppIsLoading = () =>  useAppStore((state) => state.auth.appIsLoading)

export const useAuthActions = () => useAppStore((state) => state.auth.actions)



export const useGlobalsUrlStateKey = () =>  useAppStore((state) => state.globals.urlStateKey)

export const useGlobalsEndpoint = () => useAppStore((state) => state.globals.endpoint)

export const useGlobalsEmbedded = () => useAppStore((state) => state.globals.embedded)

export const useGlobalsActions = () => useAppStore((state) => state.globals.actions)

export default StoreProvider

