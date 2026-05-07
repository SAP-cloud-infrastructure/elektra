import { createStore } from "zustand"
import { devtools } from "zustand/middleware"
import createGlobalsSlice, { GlobalsSlice } from "./createGlobalsSlice"
import createAuthDataSlice, { AuthDataSlice } from "./CreateAuthDataSlice"

export type StoreState = GlobalsSlice & AuthDataSlice

export default () =>
  createStore<StoreState>()(
    devtools((set, get, store) => ({
      ...createGlobalsSlice(set, get, store),
      ...createAuthDataSlice(set, get, store),
    }))
  )
