import { render, screen } from "@testing-library/react"
import List from "./List"

describe("object_storage", () => {
  test("capabilities", async () => {
    await render(<List data={{}} />)
    expect(screen.getByText("Capabilities")).toBeDefined()
  })
})
