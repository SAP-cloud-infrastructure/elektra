import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import userEvent from "@testing-library/user-event"
import HeadingInfo from "./HeadingInfo"

describe("HeadingInfo", () => {
  it("renders with collapsed instructions by default", () => {
    render(<HeadingInfo />)
    const button = screen.getByRole("button", { name: /show kubectl setup instructions/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("aria-expanded", "false")
  })

  it("shows instructions when button is clicked", async () => {
    const user = userEvent.setup()
    render(<HeadingInfo />)

    const button = screen.getByRole("button", { name: /show kubectl setup instructions/i })
    await user.click(button)

    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText(/hide kubectl setup instructions/i)).toBeInTheDocument()
    expect(screen.getByText(/For conveniently managing your clusters with kubectl/i)).toBeInTheDocument()
  })
})
