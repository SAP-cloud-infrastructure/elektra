// stores/jobStore.ts
import { create } from "zustand"
import { Job } from "../../types/job"

interface JobStore {
  jobs: Job[]
  isLoading: boolean
  error: string | null

  // Actions
  setJobs: (jobs: Job[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getJobById: (id: string) => Job | undefined
  updateJob: (updatedJob: Job) => void
  clearJobs: () => void
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,

  setJobs: (jobs) => set({ jobs, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  getJobById: (id) => get().jobs.find((job) => job.id === id),

  updateJob: (updatedJob) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)),
    })),

  clearJobs: () => set({ jobs: [], error: null }),
}))
