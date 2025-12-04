import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import CreateClusterWizard from "./CreateClusterWizard"
import { defaultMockClient } from "../../../mocks/TestTools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"

describe("CreateClusterWizard", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.restoreAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders modal when open", () => {
    render(
      <PortalProvider>
        <QueryClientProvider client={queryClient}>
          <CreateClusterWizard
            isOpen={true}
            onClose={() => {}}
            client={defaultMockClient}
            region="us-east-1"
            onSuccessCreate={() => {}}
          />
        </QueryClientProvider>
      </PortalProvider>
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("does not render modal when closed", () => {
    render(
      <PortalProvider>
        <QueryClientProvider client={queryClient}>
          <CreateClusterWizard
            isOpen={false}
            onClose={() => {}}
            client={defaultMockClient}
            region="us-east-1"
            onSuccessCreate={() => {}}
          />
        </QueryClientProvider>
      </PortalProvider>
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("calls onClose when cancel or confirm is clicked", () => {
    const onCloseMock = vi.fn()

    render(
      <PortalProvider>
        <QueryClientProvider client={queryClient}>
          <CreateClusterWizard
            isOpen={true}
            onClose={onCloseMock}
            client={defaultMockClient}
            region="us-east-1"
            onSuccessCreate={() => {}}
          />
        </QueryClientProvider>
      </PortalProvider>
    )

    const closeButton = screen.getByRole("button", { name: /Close/i })

    fireEvent.click(closeButton)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})
