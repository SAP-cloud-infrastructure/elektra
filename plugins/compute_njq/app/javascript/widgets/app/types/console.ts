import { z } from "zod"

// A Nova remote console for an instance. The url carries a short-lived token,
// so it is fetched fresh on every open and never cached. type/protocol are the
// console kind Nova granted (e.g. novnc/vnc, webmks/mks, serial/serial).
export const ConsoleSchema = z.object({
  url: z.string(),
  type: z.string().nullable(),
  protocol: z.string().nullable(),
})

export const ConsoleResponseSchema = z.object({
  console: ConsoleSchema,
})

export type Console = z.infer<typeof ConsoleSchema>
