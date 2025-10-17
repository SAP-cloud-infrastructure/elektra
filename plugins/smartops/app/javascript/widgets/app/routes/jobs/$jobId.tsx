import { createFileRoute } from "@tanstack/react-router"
import { Job } from "../../types/job"
import { JobDetails } from "./-components/JobDetails"
import React from "react"
import { Spinner } from "@cloudoperators/juno-ui-components"

export const Route = createFileRoute("/jobs/$jobId")({
  component: Details,
  pendingComponent: () => <Spinner size="small" aria-label="Loading Job Details" />,
  loader: async ({ context, params }) => {
    const client = context.apiClient
    if (!client) {
      throw new Error("API client is undefined")
    }
    const response = await client.get<{ data: Job[] }>(`/jobs/${params.jobId}`)
    const [job] = response.data // takes the first job from the response

    if (!job) {
      throw new Error("Job not found")
    }
    return { job }
  },
})

function Details() {
  const { job } = Route.useLoaderData()
  console.debug("Job details loaded:", job)
  return (
    <>
      <JobDetails job={job} />
    </>
  )
}

export default Details
