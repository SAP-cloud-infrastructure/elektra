import React from "react"
import { render, screen } from "@testing-library/react"
import { Breadcrumb } from "./Breadcrumb"
import "@testing-library/jest-dom"

const mockNavigate = jest.fn()

jest.mock("@tanstack/react-router", () => ({
  useMatches: jest.fn(),
  useNavigate: () => mockNavigate,
  isMatch: (match: any, key: string) => key === "loaderData.crumb" && !!match.loaderData?.crumb,
}))

import { useMatches } from "@tanstack/react-router"

describe("<Breadcrumb /> (integration with Juno)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders nothing if there are no crumbs", () => {
    const mockedUseMatches = useMatches as jest.Mock
    mockedUseMatches.mockReturnValue([])

    render(<Breadcrumb data-testid="breadcrumb-testid" />)

    // Juno's <Breadcrumb> should still be in the DOM
    const breadcrumbObj = screen.getByTestId("breadcrumb-testid")
    expect(breadcrumbObj).toBeEmptyDOMElement()
    expect(breadcrumbObj).toHaveClass("breadcrumb-container")
  })

  it("renders breadcrumb items for matches with crumbs", () => {
    const mockedUseMatches = useMatches as jest.Mock
    mockedUseMatches.mockReturnValue([
      {
        pathname: "/clusters",
        loaderData: { crumb: { label: "Clusters", icon: "cloud" } },
      },
      {
        pathname: "/services",
        loaderData: { crumb: { label: "Services" } },
      },
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
