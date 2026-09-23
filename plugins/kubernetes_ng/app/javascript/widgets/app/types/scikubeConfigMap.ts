import { z } from "zod"

/**
 * Scikube Getting Started ConfigMap response schema
 */
export const ScikubeConfigMapSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  data: z.object({
    "README.md": z.string(),
  }),
})

export type ScikubeConfigMapResponse = z.infer<typeof ScikubeConfigMapSchema>
