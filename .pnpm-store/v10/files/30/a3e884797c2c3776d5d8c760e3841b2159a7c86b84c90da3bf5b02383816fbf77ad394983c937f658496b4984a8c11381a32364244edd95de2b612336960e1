import { z } from "zod";
import { getConfig as getConfig$1, configSchema as configSchema$1 } from "@tanstack/router-generator";
const splitGroupingsSchema = z.array(
  z.array(
    z.union([
      z.literal("loader"),
      z.literal("component"),
      z.literal("pendingComponent"),
      z.literal("errorComponent"),
      z.literal("notFoundComponent")
    ])
  ),
  {
    message: "  Must be an Array of Arrays containing the split groupings. i.e. [['component'], ['pendingComponent'], ['errorComponent', 'notFoundComponent']]"
  }
).superRefine((val, ctx) => {
  const flattened = val.flat();
  const unique = [...new Set(flattened)];
  if (unique.length !== flattened.length) {
    ctx.addIssue({
      code: "custom",
      message: `  Split groupings must be unique and not repeated. i.e. i.e. [['component'], ['pendingComponent'], ['errorComponent', 'notFoundComponent']].
  You input was: ${JSON.stringify(val)}.`
    });
  }
});
const DELETABLE_NODES = ["ssr"];
const deletableNodesSchema = z.enum(DELETABLE_NODES);
const codeSplittingOptionsSchema = z.object({
  splitBehavior: z.function().optional(),
  defaultBehavior: splitGroupingsSchema.optional(),
  deleteNodes: z.array(deletableNodesSchema).optional(),
  addHmr: z.boolean().optional().default(true)
});
const configSchema = configSchema$1.extend({
  enableRouteGeneration: z.boolean().optional(),
  codeSplittingOptions: z.custom((v) => {
    return codeSplittingOptionsSchema.parse(v);
  }).optional(),
  plugin: z.object({
    vite: z.object({
      environmentName: z.string().optional()
    }).optional()
  }).optional()
});
const getConfig = (inlineConfig, root) => {
  const config = getConfig$1(inlineConfig, root);
  return configSchema.parse({ ...config, ...inlineConfig });
};
export {
  configSchema,
  deletableNodesSchema,
  getConfig,
  splitGroupingsSchema
};
//# sourceMappingURL=config.js.map
