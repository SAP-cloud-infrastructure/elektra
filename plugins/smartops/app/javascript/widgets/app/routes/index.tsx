import { createFileRoute, useLoaderData } from "@tanstack/react-router"
import { Job } from "../types/job"
import { JobList } from "./-components/JobList"
import React from "react"

export const Route = createFileRoute("/")({
  component: Index,
  loader: async ({ context }) => {
    const client = context.apiClient
    if (!client) {
      throw new Error("API client is undefined")
    }
    const jobs = await client.get<{ data: Job[] }>("/jobs").then((response) => response.data)
    return {
      jobs,
    }
  },
})

function Index() {
  const { jobs } = useLoaderData({ from: Route.id })
  console.log("Jobs data in component:", jobs)

  return (
    <>
      {" "}
      <JobList jobs={jobs} />{" "}
    </>
  )
}
