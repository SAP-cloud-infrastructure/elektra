import React from "react"
import { render, screen } from "@testing-library/react"
import { RouteMatch, useMatches } from "@tanstack/react-router"
import { Breadcrumb } from "./Breadcrumb"

const mockNavigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  useMatches: vi.fn(),
  useNavigate: () => mockNavigate,
  isMatch: (match: any, key: string) => key === "loaderData.crumb" && !!match.loaderData?.crumb,
}))

describe("<Breadcrumb /> (integration with Juno)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders nothing if there are no crumbs", () => {
    const mockedUseMatches = vi.mocked(useMatches)
    mockedUseMatches.mockReturnValue([])

    render(<Breadcrumb data-testid="breadcrumb-testid" />)

    // Juno's <Breadcrumb> should still be in the DOM
    const breadcrumbObj = screen.getByTestId("breadcrumb-testid")
    expect(breadcrumbObj).toBeEmptyDOMElement()
    expect(breadcrumbObj).toHaveClass("breadcrumb-container")
  })

  it("renders breadcrumb items for matches with crumbs", () => {
    const mockedUseMatches = vi.mocked(useMatches)

    type AnyRouteMatch = RouteMatch<any, any, any, any, any, any, any>

    mockedUseMatches.mockReturnValue([
      {
        pathname: "/clusters",
        loaderData: { crumb: { label: "Clusters", icon: "cloud" } },
      } as Partial<AnyRouteMatch> as AnyRouteMatch,
      {
        pathname: "/services",
        loaderData: { crumb: { label: "Services" } },
      } as Partial<AnyRouteMatch> as AnyRouteMatch,
    ])

    render(<Breadcrumb data-testid="breadcrumb-testid2" />)

    const breadcrumb = screen.getByTestId("breadcrumb-testid2")
    expect(breadcrumb).toBeInTheDocument()

    // find all children with class "breadcrumb-item"
    const items = breadcrumb.querySelectorAll(".breadcrumb-item")
    expect(items).toHaveLength(2)

    // optional: check labels
    expect(items[0]).toHaveTextContent("Clusters")
    expect(items[1]).toHaveTextContent("Services")
  })
})
