"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const zod = require("zod");
const routerGenerator = require("@tanstack/router-generator");
const splitGroupingsSchema = zod.z.array(
  zod.z.array(
    zod.z.union([
      zod.z.literal("loader"),
      zod.z.literal("component"),
      zod.z.literal("pendingComponent"),
      zod.z.literal("errorComponent"),
      zod.z.literal("notFoundComponent")
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
const deletableNodesSchema = zod.z.enum(DELETABLE_NODES);
const codeSplittingOptionsSchema = zod.z.object({
  splitBehavior: zod.z.function().optional(),
  defaultBehavior: splitGroupingsSchema.optional(),
  deleteNodes: zod.z.array(deletableNodesSchema).optional(),
  addHmr: zod.z.boolean().optional().default(true)
});
const configSchema = routerGenerator.configSchema.extend({
  enableRouteGeneration: zod.z.boolean().optional(),
  codeSplittingOptions: zod.z.custom((v) => {
    return codeSplittingOptionsSchema.parse(v);
  }).optional(),
  plugin: zod.z.object({
    vite: zod.z.object({
      environmentName: zod.z.string().optional()
    }).optional()
  }).optional()
});
const getConfig = (inlineConfig, root) => {
  const config = routerGenerator.getConfig(inlineConfig, root);
  return configSchema.parse({ ...config, ...inlineConfig });
};
exports.configSchema = configSchema;
exports.deletableNodesSchema = deletableNodesSchema;
exports.getConfig = getConfig;
exports.splitGroupingsSchema = splitGroupingsSchema;
//# sourceMappingURL=config.cjs.map
