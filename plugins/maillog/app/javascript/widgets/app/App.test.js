import React from "react"
import { render } from "@testing-library/react"
import { act } from "react"
// support shadow dom queries
// https://reactjsexample.com/an-extension-of-dom-testing-library-to-provide-hooks-into-the-shadow-dom/
import { screen } from "shadow-dom-testing-library"
import App from "./App"

test("renders app", async () => {
  await act(() => render(<App />))

  let loginTitle = await screen.queryAllByShadowText(/Converged Cloud/i)
  expect(loginTitle.length > 0).toBe(true)
})
