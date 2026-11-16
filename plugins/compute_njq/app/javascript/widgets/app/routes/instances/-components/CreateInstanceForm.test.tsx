import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { CreateInstanceForm } from "./CreateInstanceForm"

vi.mock("../../../hooks/useFormOptionQueries", () => ({
  useFlavorsQuery: () => ({ data: [{ id: "f1", name: "m1.small" }], isLoading: false }),
  useImagesQuery: () => ({ data: { images: [{ id: "i1", name: "ubuntu" }], next_marker: null }, isLoading: false }),
  useKeypairsQuery: () => ({ data: [{ name: "k1" }], isLoading: false }),
  useNetworksQuery: () => ({ data: [{ id: "n1", name: "private" }], isLoading: false }),
  useSecurityGroupsQuery: () => ({ data: [{ id: "sg1", name: "default" }], isLoading: false }),
  useAvailabilityZonesQuery: () => ({ data: [{ name: "az-1" }], isLoading: false }),
}))

const mutate = vi.fn()
let mutationState = { mutate, isPending: false, isError: false, error: null as Error | null }
vi.mock("../../../hooks/useCreateInstanceMutation", () => ({
  useCreateInstanceMutation: () => mutationState,
}))

const api = {} as never
const queryClient = new QueryClient()

describe("CreateInstanceForm", () => {
  it("keeps submit disabled until required fields are valid", () => {
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled()
  })

  it("shows an error alert when the mutation fails", () => {
    mutationState = { mutate, isPending: false, isError: true, error: new Error("Quota exceeded (HTTP 403)") }
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)
    expect(screen.getByText(/Quota exceeded/)).toBeInTheDocument()
  })
})
