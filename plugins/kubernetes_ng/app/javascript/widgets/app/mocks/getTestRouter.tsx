import React from "react"
import { createRouter, createMemoryHistory, RouterOptions, createRootRoute } from "@tanstack/react-router"

export const getTestRouter = ({ routeTree, history }: RouterOptions<any, any, any, any, any>) => {
  const options = {
    routeTree: routeTree,
    history: history || createMemoryHistory(),
    defaultPendingMinMs: 0,
    context: {
      apiClient: null,
    },
  }

  return createRouter(options)
}
