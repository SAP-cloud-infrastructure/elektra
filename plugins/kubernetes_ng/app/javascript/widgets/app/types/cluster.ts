import { z } from "zod"

// Define simplified worker schema for the UI
export const workerSchema = z.object({
  name: z.string(),
  architecture: z.string(),
  machineType: z.string(),
  machineImage: z.object({
    name: z.string(),
    version: z.string(),
  }),
  containerRuntime: z.string(),
  min: z.number(),
  max: z.number(),
  actual: z.number().optional(),
  maxSurge: z.number(),
  zones: z.array(z.string()),
})

// Define simplified cluster schema for the UI
export const ClusterSchema = z.object({
  // List view fields
  uid: z.string().uuid(),
  name: z.string(),
  region: z.string(),
  infrastructure: z.string(),
  status: z.string(),
  version: z.string(),
  readiness: z.object({
    status: z.string(),
    conditions: z.array(
      z.object({
        displayValue: z.string(),
        type: z.string(),
        status: z.string(),
      })
    ),
  }),
  purpose: z.string().optional(),
  cloudProfileName: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  // New state information fields
  stateDetails: z
    .object({
      state: z.string().optional(),
      progress: z.number().optional(),
      type: z.string().optional(),
      description: z.string().optional(),
      lastTransitionTime: z.string().optional(),
    })
    .optional(),

  // Additional detail fields
  workers: z.array(workerSchema),

  maintenance: z.object({
    startTime: z.string(),
    timezone: z.string(),
    windowTime: z.string(),
  }),

  lastMaintenance: z.object({
    state: z.string().optional(),
  }),

  autoUpdate: z.object({
    os: z.boolean(),
    kubernetes: z.boolean(),
  }),
})
export const ClustersSchema = z.array(ClusterSchema)

export type Worker = z.infer<typeof workerSchema>
export type Cluster = z.infer<typeof ClusterSchema>
