import { StateCreator } from "zustand"

export interface AuthData {
  token: string | null
  project: string | null
}

export interface AuthDataSlice {
  auth: {
    token: string | null
    project: string | null
    actions: {
      setAuthData: (data: AuthData | null) => void
    }
  }
}

const createAuthDataSlice: StateCreator<AuthDataSlice, [], [], AuthDataSlice> = (set, get) => ({
  auth: {
    token: null,
    project: null,

    actions: {
      setAuthData: (data: AuthData | null) => {
        if (!data) return
        // check if data has changed before updating the state
        if (data.token === get().auth.token && data.project === get().auth.project) return
        set((state) => ({
          auth: {
            ...state.auth,
            token: data?.token,
            project: data?.project,
          },
        }))
      },
    },
  },
})

export default createAuthDataSlice
