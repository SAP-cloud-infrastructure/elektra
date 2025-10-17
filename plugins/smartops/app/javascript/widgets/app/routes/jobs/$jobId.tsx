import { createFileRoute } from "@tanstack/react-router"
import { Job } from "../../types/job"
import { JobDetails } from "./-components/JobDetails"
import React from "react"
import { Spinner } from "@cloudoperators/juno-ui-components"
import { useJobStore } from "../stores/jobStore"

export const Route = createFileRoute("/jobs/$jobId")({
  component: Details,
  pendingComponent: () => <Spinner size="small" aria-label="Loading Job Details" />,
  loader: async ({ context, params }) => {
    const client = context.apiClient
    if (!client) {
      throw new Error("API client is undefined")
    }

    // 1. check the Zustand store first
    const cachedJob = useJobStore.getState().getJobById(params.jobId)
    if (cachedJob) {
      console.debug("Using job from store:", cachedJob)
      return { job: cachedJob, source: "store" }
    }

    // 2. Fallback: api call for deeplink or store miss
    try {
      const response = await client.get<{ data: Job[] }>(`/jobs/${params.jobId}`)
      const [job] = response.data
      if (!job) {
        throw new Error("Job not found")
      }

      // store the job in Zustand store
      useJobStore.getState().updateJob(job)
      console.debug("Fetched job from API:", job)
      return { job, source: "api" }
    } catch (error) {
      console.error("Failed to load job:", error)
      throw new Error(`Job with ID ${params.jobId} not found`)
    }
  },
})

function Details() {
  const { job } = Route.useLoaderData()
  return (
    <>
      <JobDetails job={job} />
    </>
  )
}
