import React from "react"
import { render, act, screen, within } from "@testing-library/react"
import { RouterProvider, createMemoryHistory, createRootRouteWithContext, createRoute } from "@tanstack/react-router"
import { getTestRouter, TestContext } from "../../mocks/TestTools"
import { CLUSTERS_ROUTE_ID, RouteLoader } from "./route"
import { Root } from "../__root"

const renderComponent = () => {
  const rootRoute = createRootRouteWithContext<TestContext>()({
    component: Root,
  })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/clusters/",
    loader: RouteLoader,
    component: () => <div>Clusters Page</div>,
  })

  const routeTree = rootRoute.addChildren([testRoute])

  const router = getTestRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [CLUSTERS_ROUTE_ID] }),
  })

  return render(<RouterProvider router={router} />)
}

describe("Clusters Route", () => {
  test("renders Root with breadcrumb", async () => {
    await act(async () => renderComponent())

    expect(
      within(screen.getByRole("navigation", { name: /breadcrumb/i })).getByRole("link", { name: "Clusters" })
    ).toBeInTheDocument()
  })
})
