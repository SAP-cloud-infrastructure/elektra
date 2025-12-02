import React from "react"
import { renderHook, screen, act } from "@testing-library/react"
import { WizardContextProps, WizardProvider, useWizard } from "./WizzardProvider"
import Progress from "./Progress"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../../../mocks/TestTools"
import * as wizardHook from "./WizzardProvider"
import { STEP_DEFINITIONS } from "./constants"

const TestWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={defaultMockClient} region="us-east-1">
          <Progress />
          {children}
        </WizardProvider>
      </QueryClientProvider>
    </PortalProvider>
  )

describe("Progress", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders all steps", async () => {
    const wrapper = TestWrapper(queryClient)

    const { result } = renderHook(() => useWizard(), { wrapper })

    await act(async () => {
      await result.current.handleSetCurrentStep(0)
    })

    expect(screen.getByRole("button", { name: /Basic Info/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Worker Groups/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Summary/i })).toBeInTheDocument()
  })

  it("marks the current step with aria-current", async () => {
    const wrapper = TestWrapper(queryClient)

    const { result } = renderHook(() => useWizard(), { wrapper })

    await act(async () => {
      await result.current.handleSetCurrentStep(1)
    })

    const workerButton = screen.getByRole("button", { name: /Worker Groups/i })
    expect(workerButton).toHaveAttribute("aria-current", "step")
  })

  it("disables future steps", async () => {
    const wrapper = TestWrapper(queryClient)

    const { result } = renderHook(() => useWizard(), { wrapper })

    await act(async () => {
      await result.current.handleSetCurrentStep(0)
    })

    const workerButton = screen.getByRole("button", { name: /Worker Groups/i })
    expect(workerButton).toBeDisabled()
    const summaryButton = screen.getByRole("button", { name: /Summary/i })
    expect(summaryButton).toBeDisabled()
  })

  it("shows success icon on completed steps", async () => {
    const wrapper = TestWrapper(queryClient)

    vi.spyOn(wizardHook, "useWizard").mockReturnValue({
      currentStep: 2, // set manually to last step
      handleSetCurrentStep: vi.fn(),
      steps: STEP_DEFINITIONS.map((s) => ({ ...s, hasError: false })), // no errors
    } as Partial<WizardContextProps> as WizardContextProps)

    renderHook(() => useWizard(), { wrapper })

    // Step 0 & 1 should have a checkCircle icon
    const successIcons = screen
      .getAllByRole("img", { hidden: true })
      .filter((node) => String(node.getAttribute("class")).includes("checkCircle"))
    expect(successIcons.length).toBe(2)
  })

  it("shows error icon if a step hasError = true", () => {
    const wrapper = TestWrapper(queryClient)

    vi.spyOn(wizardHook, "useWizard").mockReturnValue({
      currentStep: 1, // set manually to last step
      handleSetCurrentStep: vi.fn(),
      steps: STEP_DEFINITIONS.map((s, i) => ({ ...s, hasError: i === 0 })), // true only for step 0
    } as Partial<WizardContextProps> as WizardContextProps)

    renderHook(() => useWizard(), { wrapper })

    const errorIcons = screen
      .getAllByRole("img", { hidden: true })
      .filter((node) => String(node.getAttribute("class")).includes("icon-cancel"))
    expect(errorIcons.length).toBe(1)
  })
})
