// zod schema for job data
import { z } from "zod"

// Job states enum for better type safety
// NOTE: this needs to be kept in sync with the backend
export const JobState = z.enum([
  "initial",
  "scheduled",
  "pending",
  "waiting",
  "running",
  "successful",
  "error",
  "reset",
  "canceled",
  "cancelling",
  "failed",
  "unknown",
])

// Object types enum
export const ObjectType = z.enum(["server", "network"])

export const JobSchema = z.object({
  id: z.string(),
  created_at: z.string().datetime(), // ISO 8601 datetime string
  name: z.string(),
  policy: z.string().optional(),
  description: z.string().optional(),
  state: JobState.optional(),
  schedule_date: z.string().datetime(),
  due_date: z.string().datetime(),
  object_type: ObjectType,
  object_id: z.string(),
})

// type for job data
export type Job = z.infer<typeof JobSchema>

// array of jobs
export const JobsSchema = z.array(JobSchema)

// type for array of jobs
export type Jobs = z.infer<typeof JobsSchema>

// Filter schema for API query parameters
export const JobFilterSchema = z
  .object({
    name: z.string().optional(),
    type: ObjectType.optional(),
    id: z.string().optional(),
    scheduled_date: z.string().datetime().optional(),
    due_date: z.string().datetime().optional(),
    state: JobState.optional(),
    policy: z.string().optional(),
    object_id: z.string().optional(),
  })
  .partial()

export type JobFilter = z.infer<typeof JobFilterSchema>

export const ApiResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
    jobs: JobsSchema.optional(),
    job: JobSchema.optional(),
    error: z.string().optional(),
  }),
})

export type ApiResponse = z.infer<typeof ApiResponseSchema>
