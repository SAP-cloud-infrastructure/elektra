import React from "react"
import { render, act, screen } from "@testing-library/react"
import { createRootRoute, RouterProvider, createMemoryHistory, createRoute } from "@tanstack/react-router"
import { getTestRouter } from "../mocks/TestTools"

import { Root } from "./__root"

const renderComponent = () => {
  const rootRoute = createRootRoute({
    component: () => <Root />,
  })

  const testChildRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/test-child",
    loader: () => ({
      crumb: { label: `test-breadcrumb` },
    }),
    component: () => <div>Test Child Route</div>,
  })

  const routeTree = rootRoute.addChildren([testChildRoute])

  const router = getTestRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ["/test-child"],
    }),
  })

  return {
    ...render(<RouterProvider router={router} />),
    router,
  }
}

describe("<Root />", () => {
  test("renders Root with breadcrumb with a test entry", async () => {
    await act(async () => renderComponent())

    // Breadcrumb should be in the document
    screen.getByRole("link", { name: "test-breadcrumb" })
  })
})
