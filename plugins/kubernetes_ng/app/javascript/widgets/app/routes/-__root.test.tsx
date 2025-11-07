import React from "react"
import { render, act, screen } from "@testing-library/react"
import { createRootRoute, RouterProvider, createMemoryHistory } from "@tanstack/react-router"
import { getTestRouter } from "../mocks/TestTools"

import { Root } from "./__root"

const renderComponent = () => {
  const rootRoute = createRootRoute({
    component: () => <Root />,
  })
  const routeTree = rootRoute.addChildren([])
  const router = getTestRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ["/"],
    }),
  })

  return {
    ...render(<RouterProvider router={router} />),
    router,
  }
}

describe("<Root />", () => {
  test("renders Root with breadcrumb", async () => {
    await act(async () => renderComponent())

    // Breadcrumb should be in the document
    expect(screen.getByTestId("main-breadcrumb")).toBeInTheDocument()
  })
})
