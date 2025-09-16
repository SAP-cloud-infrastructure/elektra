import React from "react"
import { create } from "zustand"

// global zustand store. See how this works here: https://github.com/pmndrs/zustand
const useStore = create((set) => ({
  showNewSecret: false,
  setShowNewSecret: (show) => set((state) => ({ showNewSecret: show })),
  showNewContainer: false,
  setShowNewContainer: (show) => set((state) => ({ showNewContainer: show })),
  showNewOrder: false,
  setShowNewOrder: (show) => set((state) => ({ showNewOrder: show })),
  showLoadingOnSecretItem: false,
  setShowLoadingOnSecretItem: (show) =>
    set((state) => ({ showLoadingOnSecretItem: show })),
  showLoadingOnOrderItem: false,
  setShowLoadingOnOrderItem: (show) =>
    set((state) => ({ showLoadingOnOrderItem: show })),
}))

export default useStore
