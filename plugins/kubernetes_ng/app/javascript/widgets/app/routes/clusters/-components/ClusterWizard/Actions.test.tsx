import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Actions from "./Actions"
import { WizardContextProps, WizardProvider, DEFAULT_CLUSTER_FORM_DATA } from "./WizzardProvider"
import { defaultCluster, permissionsAllTrue, externalNetworks, cloudProfiles } from "../../../../mocks/data"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GardenerApi } from "../../../../apiClient"
import * as wizardHook from "./WizzardProvider"
import { STEP_DEFINITIONS } from "./constants"
import { UseMutationResult } from "@tanstack/react-query"

describe("Actions component", () => {
  const onSuccessCreate = vi.fn()
  let queryClient: QueryClient
  let mockClient: GardenerApi

  beforeEach(() => {
    onSuccessCreate.mockClear()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockClient = {
      gardener: {
        getClusters: () => Promise.resolve([defaultCluster]),
        getClusterByName: () => Promise.resolve(defaultCluster),
        createCluster: () => Promise.resolve(defaultCluster),

        getPermissions: () => Promise.resolve(permissionsAllTrue),

        getExternalNetworks: () => Promise.resolve(externalNetworks),
        getCloudProfiles: () => Promise.resolve(cloudProfiles),
      },
    }
  })

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={mockClient} region="us-east-1">
          <Actions onSuccessCreate={onSuccessCreate} />
        </WizardProvider>
      </QueryClientProvider>
    )

  it("renders Back and Next buttons on the first step", () => {
    renderComponent()

    expect(screen.getByRole("button", { name: /Back/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Next/i })).toBeEnabled()
  })

  it("enables Back button after clicking Next", async () => {
    renderComponent()

    const backButton = screen.getByRole("button", { name: /Back/i })
    const nextButton = screen.getByRole("button", { name: /Next/i })

    // Initial state
    expect(backButton).toBeDisabled()

    // Click Next to go to next step
    fireEvent.click(nextButton)

    // After clicking Next, Back should be enabled
    await waitFor(() => expect(backButton).toBeEnabled())
  })

  it("renders Create Cluster button on last step", async () => {
    renderComponent()
    const nextButton = screen.getByRole("button", { name: /Next/i })

    // Click first step → step 1
    fireEvent.click(nextButton)
    expect(screen.getByRole("button", { name: /Back/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /Next/i })).toBeEnabled()

    // Click second step → step 2
    fireEvent.click(nextButton)

    // The last step button should be "Create Cluster"
    const createButton = await screen.findByRole("button", { name: /Create Cluster/i })
    expect(createButton).toBeInTheDocument()
    expect(createButton).toBeDisabled()
  })

  it("calls onSuccessCreate after clicking Create Cluster", async () => {
    // Mock useWizard
    const createMutation: Partial<UseMutationResult<typeof defaultCluster>> = {
      mutate: vi.fn((_, { onSuccess }) => onSuccess(defaultCluster)),
      isLoading: false,
    }

    vi.spyOn(wizardHook, "useWizard").mockReturnValue({
      currentStep: 2, // set manually to last step
      handleSetCurrentStep: vi.fn(),
      steps: STEP_DEFINITIONS.map((s) => ({ ...s, hasError: false })), // no errors
      clusterFormData: DEFAULT_CLUSTER_FORM_DATA,
      createMutation: createMutation as UseMutationResult<typeof defaultCluster>,
    } as Partial<WizardContextProps> as WizardContextProps)

    renderComponent()
    const createButton = screen.getByRole("button", { name: /Create Cluster/i })
    fireEvent.click(createButton)
    // onSuccessCreate should be called with cluster name
    await waitFor(() => expect(onSuccessCreate).toHaveBeenCalledWith(defaultCluster.name))
  })
})
