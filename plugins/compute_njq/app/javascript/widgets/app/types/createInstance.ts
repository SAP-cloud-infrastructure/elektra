import { z } from "zod"

const NAME_FORBIDDEN = /^.*\.\d+$/

export const CreateInstancePayloadSchema = z.object({
  name: z
    .string()
    .min(1)
    .refine((n) => !NAME_FORBIDDEN.test(n), {
      message: "Name must not end with a dot followed by a number",
    }),
  flavor_id: z.string().min(1),
  image_id: z.string().min(1),
  keypair: z.string().min(1),
  availability_zone: z.string().optional(),
  network_id: z.string().min(1),
  security_groups: z.array(z.string()),
  user_data: z.string(),
})

export type CreateInstancePayload = z.infer<typeof CreateInstancePayloadSchema>
