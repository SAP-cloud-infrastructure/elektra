import React from "react"
import { screen, within, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import ClusterList from "./ClusterList"
import { renderComponent } from "../../../mocks/TestTools"
import { defaultCluster } from "../../../mocks/data"

const expectClusterListHeaders = () => {
  // check the visible headers
  expect(screen.getByText("Status")).toBeInTheDocument()
  expect(screen.getByText("Name")).toBeInTheDocument()
  expect(screen.getByText("Readiness")).toBeInTheDocument()
  expect(screen.getByText("Version")).toBeInTheDocument()

  // check number of columns
  const columnHeaders = screen.getAllByRole("columnheader")
  expect(columnHeaders).toHaveLength(6)

  // check the first header contains the icon
  const icon = within(columnHeaders[0]).getByRole("img")
  expect(icon).toBeInTheDocument()
}

describe("<ClusterList />", () => {
  it("renders the table headers if clusters are present", async () => {
    await act(async () => renderComponent(<ClusterList clusters={[defaultCluster]} />))
    expectClusterListHeaders()
  })

  it("renders updated at", async () => {
    await act(async () => renderComponent(<ClusterList clusters={[defaultCluster]} updatedAt={Date.now()} />))

    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument()
  })

  it("renders a ClusterListItem for each cluster", async () => {
    const clusters = [
      { ...defaultCluster, uid: "1", name: "cluster-one" },
      { ...defaultCluster, uid: "2", name: "cluster-two" },
    ]

    await act(() => renderComponent(<ClusterList clusters={clusters} />))
    expect(screen.getByText(clusters[0].name)).toBeInTheDocument()
    expect(screen.getByText(clusters[1].name)).toBeInTheDocument()
  })

  it("renders 'No clusters found' when the clusters array is empty with the list header", async () => {
    await act(async () => renderComponent(<ClusterList clusters={[]} />))

    expectClusterListHeaders()

    expect(screen.getByText("No clusters found")).toBeInTheDocument()
  })
})
