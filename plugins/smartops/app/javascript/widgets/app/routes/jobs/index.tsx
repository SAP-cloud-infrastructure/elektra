// jobs/index.tsx
import { createFileRoute, useLoaderData, useNavigate, useSearch } from "@tanstack/react-router"
import type { Job, ApiResponse } from "../../types/api"
import { JobList } from "./-components/JobList"
import { JobDetails } from "./-components/JobDetails"
import { IntroBox, Panel, PanelBody, Spinner, Message } from "@cloudoperators/juno-ui-components"
import { useState, useEffect } from "react"
import { router } from "../../router"
import { useRef } from "react"

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

    try {
      const result = await client.get<ApiResponse>("/jobs").then((response) => response.data)
      const jobs = result.jobs!
      const sortedJobs = sortJobsByStatus(jobs)

      return {
        jobs: sortedJobs,
        domainName: context.domainName,
        projectName: context.projectName,
        apiClient: client,
      }
    } catch (error) {
      let message = "Unknown Error"
      if (error instanceof Error) message = error.message
      return {
        jobs: [],
        domainName: context.domainName,
        projectName: context.projectName,
        apiClient: client,
        error: message,
      }
    }
  },
  // only reload when navigating away and back to the route
  // this is needed otherwise the job list is also loaded when details panel is opened
  shouldReload: false,
})

function Jobs() {
  const { jobs, domainName, projectName, apiClient, error } = useLoaderData({ from: Route.id })
  const search = useSearch({ from: Route.id })
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loadingJob, setLoadingJob] = useState(false)
  // handle job panel state to know if it's open or closed
  const [panelOpen, setPanelOpen] = useState(false)
  const currentJobIdRef = useRef<string | undefined>(undefined)

  // Load job when search params change
  useEffect(() => {
    if (search?.jobId && apiClient) {
      setLoadingJob(true)
      setDetailsError(null)
      setPanelOpen(true)

      apiClient
        .get<ApiResponse>(`/jobs/${search.jobId}`)
        .then((response) => {
          if (response.data.success && response.data.job) {
            setSelectedJob(response.data.job)
          }
          setLoadingJob(false)
          currentJobIdRef.current = search.jobId
        })
        .catch((error) => {
          const message = typeof error === "string" ? error : error instanceof Error ? error.message : "Unknown error"
          setDetailsError("Failed to load job details: " + message)
          setLoadingJob(false)
        })
    } else {
      setSelectedJob(null)
      setPanelOpen(false)
      currentJobIdRef.current = undefined
    }
  }, [search?.jobId, apiClient])

  const handleClosePanel = () => {
    navigate({
      to: "/jobs",
    })
    setPanelOpen(false)
    setDetailsError(null)
    setLoadingJob(false)
    currentJobIdRef.current = undefined
    router.invalidate()
  }

  const handleJobSelect = (jobId: string) => {
    // If clicking the same job that's currently open, close it
    // this is used in JobItem component
    if (jobId === currentJobIdRef.current && panelOpen) {
      handleClosePanel()
    } else {
      // Navigate to the job
      navigate({
        to: "/jobs",
        search: { jobId },
      })
    }
  }

  return (
    <>
      <Panel
        heading={selectedJob ? `Job: ${selectedJob.name}` : "Loading Job Details..."}
        opened={panelOpen}
        onClose={handleClosePanel}
      >
        <PanelBody>
          {detailsError && <Message variant="error" text={detailsError} />}
          {loadingJob ? (
            <Spinner size="small" aria-label="Loading Jobs" />
          ) : (
            selectedJob && (
              <JobDetails job={selectedJob} domainName={domainName} projectName={projectName} apiClient={apiClient} />
            )
          )}
        </PanelBody>
      </Panel>
      <div>
        <IntroBox text="SmartOps helps to manage planned maintenance activities..." />
        {error ? (
          <Message variant="error" title="Failed to load jobs" text={error} />
        ) : (
          <JobList jobs={jobs} isLoading={false} onJobSelect={handleJobSelect} />
        )}
      </div>
    </>
  )
}
