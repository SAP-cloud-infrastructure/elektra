import { z } from "zod"

export const PermissionsSchema = z.object({
  list: z.boolean(),
  get: z.boolean(),
  create: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
})

export type Permissions = z.infer<typeof PermissionsSchema>
