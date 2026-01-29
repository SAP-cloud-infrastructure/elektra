import { createStore } from "zustand"
import { devtools } from "zustand/middleware"
import createGlobalsSlice from "./createGlobalsSlice"
import createAuthDataSlice from "./CreateAuthDataSlice"
export default () =>
  createStore(
    devtools((set, get) => ({
      ...createGlobalsSlice(set, get),
      ...createAuthDataSlice(set, get),
    }))
  )

  