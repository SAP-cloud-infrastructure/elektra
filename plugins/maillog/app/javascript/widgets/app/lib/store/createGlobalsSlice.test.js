import * as React from "react"
import { renderHook } from "@testing-library/react"
import { act } from "react"
import StoreProvider, {
  useGlobalsActions,
  useGlobalsUrlStateKey,
} from "../../components/StoreProvider"

describe("createGlobalsSlice", () => {
  describe("setUrlStateKey", () => {
    it("examples a basic test", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          urlStateKey: useGlobalsUrlStateKey(),
        }),
        { wrapper }
      )

      act(() => {
        store.result.current.globalsActions.setUrlStateKey("example app")
      })

      expect(store.result.current.urlStateKey).toEqual("example app")
    })
  })
})
