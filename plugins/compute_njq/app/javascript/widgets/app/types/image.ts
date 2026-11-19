import { z } from "zod"

// Minimal image status shape for snapshot polling. The BFF reads the Glance
// image's status; name is nullable because a just-queued image may not have
// settled its name yet.
export const ImageStatusSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  status: z.string(),
})
export type ImageStatus = z.infer<typeof ImageStatusSchema>

export const ImageStatusResponseSchema = z.object({ image: ImageStatusSchema })

// Snapshot creation only acknowledges; the new image id lets the client poll.
// Nullable because the Location header + name fallback can both miss.
export const SnapshotResponseSchema = z.object({ image_id: z.string().nullable() })
export type SnapshotResponse = z.infer<typeof SnapshotResponseSchema>
