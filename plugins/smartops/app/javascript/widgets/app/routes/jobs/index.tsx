// jobs/index.tsx
import { createFileRoute, useLoaderData, useNavigate, useSearch } from "@tanstack/react-router"
import type { Job, ApiResponse } from "../../types/api"
import { JobList } from "./-components/JobList"
import { JobDetails } from "./-components/JobDetails"
import { IntroBox, Panel, PanelBody, Spinner } from "@cloudoperators/juno-ui-components"
import { useState, useEffect } from "react"

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

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }
    if (indexA !== -1 && indexB === -1) return -1
    if (indexA === -1 && indexB !== -1) return 1
    return stateA.localeCompare(stateB)
  })
}

export const Route = createFileRoute("/jobs/")({
  component: Jobs,
  pendingComponent: () => <JobList jobs={[]} isLoading={true} />,
  validateSearch: (search: Record<string, unknown>) => {
    // search is opntional
    if (!search || typeof search !== "object") {
      return {}
    }
    // Validate that jobId, if present, is a string
    // this is for details panel
    return {
      jobId: typeof search.jobId === "string" ? search.jobId : undefined,
    }
  },
  loader: async ({ context }) => {
    const client = context.apiClient
    if (!client) {
      throw new Error("API client is undefined")
    }

    // Load jobs list
    const result = await client.get<ApiResponse>("/jobs").then((response) => response.data)
    if (!result.success || !result.jobs) {
      throw new Error(result.error?.message || "Failed to fetch jobs")
    }

    const jobs = result.jobs
    const sortedJobs = sortJobsByStatus(jobs)

    return {
      jobs: sortedJobs,
      domainName: context.domainName,
      projectName: context.projectName,
      apiClient: client,
    }
  },
})

function Jobs() {
  const { jobs, domainName, projectName, apiClient } = useLoaderData({ from: Route.id })
  const search = useSearch({ from: Route.id })
  const navigate = useNavigate()

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loadingJob, setLoadingJob] = useState(false)

  console.log("Component search:", search)

  // Load job when search params change
  useEffect(() => {
    if (search?.jobId && apiClient) {
      console.log("Loading job for ID:", search.jobId)
      setLoadingJob(true)
      apiClient
        .get<ApiResponse>(`/jobs/${search.jobId}`)
        .then((response) => {
          console.log("Job loaded:", response.data)
          if (response.data.success && response.data.job) {
            setSelectedJob(response.data.job)
          }
        })
        .catch((error) => {
          console.error("Failed to load job details:", error)
        })
        .finally(() => {
          setLoadingJob(false)
        })
    } else {
      setSelectedJob(null)
    }
  }, [search?.jobId, apiClient])

  const handleClosePanel = () => {
    navigate({
      to: "/jobs",
    })
  }

  return (
    <>
      <Panel
        heading={selectedJob ? `Job: ${selectedJob.name}` : "Loading Job Details..."}
        opened={!!selectedJob || loadingJob}
        onClose={handleClosePanel}
      >
        <PanelBody>
          {loadingJob ? (
            <>
              <Spinner size="small" aria-label="Loading Jobs" />
            </>
          ) : (
            selectedJob && (
              <JobDetails job={selectedJob} domainName={domainName} projectName={projectName} apiClient={apiClient} />
            )
          )}
        </PanelBody>
      </Panel>

      <div>
        <IntroBox text="SmartOps helps to manage planned maintenance activities for virtual machines across your infrastructure. Schedule and coordinate planned updates, and maintenance jobs while minimizing service disruption and ensuring business continuity. Manage and monitor your jobs here and set a Schedule date." />
        <JobList jobs={jobs} isLoading={false} />
      </div>
    </>
  )
}
