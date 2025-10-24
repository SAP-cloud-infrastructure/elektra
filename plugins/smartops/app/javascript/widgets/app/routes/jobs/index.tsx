import { createFileRoute, useLoaderData } from "@tanstack/react-router"
import type { Job, ApiResponse } from "../../types/api"
import { JobList } from "./-components/JobList"
import { IntroBox } from "@cloudoperators/juno-ui-components"

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
  "unknown",
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

export const Route = createFileRoute("/jobs/")({
  component: Jobs,
  pendingComponent: () => <JobList jobs={[]} isLoading={true} />,
  loader: async ({ context }) => {
    const client = context.apiClient
    if (!client) {
      throw new Error("API client is undefined")
    }
    const result = await client.get<ApiResponse>("/jobs").then((response) => response.data)
    console.log("Fetched jobs:", result)
    if (!result.success || !result.jobs) {
      throw new Error(result.error?.message || "Failed to fetch jobs")
    }
    const jobs = result.jobs
    const sortedJobs = sortJobsByStatus(jobs)
    return {
      jobs: sortedJobs,
    }
  },
})

function Jobs() {
  const { jobs } = useLoaderData({ from: Route.id })

  return (
    <>
      <IntroBox text="SmartOps helps to manage planned maintenance activities for virtual machines across your infrastructure. Schedule and coordinate planned updates, and maintenance jobs while minimizing service disruption and ensuring business continuity. Manage and monitor your jobs here and set a Schedule date." />
      <JobList jobs={jobs} isLoading={false} />
    </>
  )
}
