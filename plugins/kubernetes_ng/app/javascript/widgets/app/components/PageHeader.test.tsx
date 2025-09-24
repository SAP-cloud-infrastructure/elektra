import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import PageHeader from "./PageHeader"

describe("<PageHeader />", () => {
  it("renders the title", () => {
    render(<PageHeader title="Main Title" />)
    expect(screen.getByRole("heading", { name: "Main Title" })).toBeInTheDocument()
  })

  it("renders the subtitle when provided", () => {
    render(<PageHeader title="Main Title" subtitle="Subheading" />)
    expect(screen.getByText("Subheading")).toBeInTheDocument()
  })

  it("does not render subtitle if not provided", () => {
    render(<PageHeader title="Main Title" />)
    expect(screen.queryByText("Subheading")).not.toBeInTheDocument()
  })

  it("renders children inside the inner stack", () => {
    render(
      <PageHeader title="Main Title">
        <button>Action</button>
      </PageHeader>
    )
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument()
  })
})
