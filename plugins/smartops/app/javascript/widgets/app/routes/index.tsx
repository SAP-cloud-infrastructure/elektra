// Remove the /show route file and update your index route
import { createFileRoute, useLoaderData, useNavigate, useSearch } from "@tanstack/react-router"
import { Job } from "../types/job"
import { JobList } from "./-components/JobList"
import { JobDetails } from "./-components/JobDetails"
import React from "react"

// Define search params type
type JobSearch = {
  jobId?: string
}

const STATUS_ORDER = [
  "initial",
  "scheduled",
  "pending",
  "waiting",
  "running",
  "cancelling",
  "successful",
  "failed",
  "error",
  "canceled",
  "reset",
] as const

function sortJobsByStatus(jobs: Job[]): Job[] {
  return jobs.sort((a, b) => {
    const stateA = a.state || "unknown"
    const stateB = b.state || "unknown"

    const indexA = STATUS_ORDER.indexOf(stateA)
    const indexB = STATUS_ORDER.indexOf(stateB)

    // Wenn beide Status in der ORDER sind, nach Position sortieren
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }

    // Status in ORDER haben Priorität vor unbekannten Status
    if (indexA !== -1 && indexB === -1) return -1
    if (indexA === -1 && indexB !== -1) return 1

    // Beide unbekannt: alphabetisch sortieren
    return stateA.localeCompare(stateB)
  })
}

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (search: Record<string, unknown>): JobSearch => {
    // validate and return search params for jobId
    // this is needed to render the JobDetails panel based on the jobId in the URL
    return {
      jobId: typeof search.jobId === "string" ? search.jobId : undefined,
    }
  },
  loader: async ({ context }) => {
    const client = context.apiClient
    if (!client) {
      throw new Error("API client is undefined")
    }
    const jobs = await client.get<{ data: Job[] }>("/jobs").then((response) => response.data)
    const sortedJobs = sortJobsByStatus(jobs)

    return {
      jobs: sortedJobs,
    }
  },
})

function Index() {
  const { jobs } = useLoaderData({ from: Route.id })
  console.debug("Jobs data in component:", jobs)

  const { jobId } = useSearch({ from: Route.id })
  const navigate = useNavigate({ from: Route.id })

  // Find the selected job based on jobId from search params
  console.debug("Current jobId from search params:", jobId)
  const selectedJob = jobId ? jobs.find((job) => job.id === jobId) : null

  const handleClosePanel = () => {
    navigate({ search: {} })
  }

  return (
    <>
      <JobList jobs={jobs} />
      {selectedJob && <JobDetails job={selectedJob} onClose={handleClosePanel} />}
    </>
  )
}
