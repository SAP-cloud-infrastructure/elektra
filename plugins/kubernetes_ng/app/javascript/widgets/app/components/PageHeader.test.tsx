import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import PageHeader from "./PageHeader"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("<PageHeader />", () => {
  it("renders the title", () => {
    render(<PageHeader title="Main Title" />, { wrapper: createWrapper() })
    expect(screen.getByRole("heading", { name: "Main Title" })).toBeInTheDocument()
  })

  it("renders the subtitle when provided", () => {
    render(<PageHeader title="Main Title" subtitle="Subheading" />, { wrapper: createWrapper() })
    expect(screen.getByText("Subheading")).toBeInTheDocument()
  })

  it("does not render subtitle if not provided", () => {
    render(<PageHeader title="Main Title" />, { wrapper: createWrapper() })
    expect(screen.queryByText("Subheading")).not.toBeInTheDocument()
  })

  it("renders children inside the inner stack", () => {
    render(
      <PageHeader title="Main Title">
        <button>Action</button>
      </PageHeader>,
      { wrapper: createWrapper() }
    )
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument()
  })
})
