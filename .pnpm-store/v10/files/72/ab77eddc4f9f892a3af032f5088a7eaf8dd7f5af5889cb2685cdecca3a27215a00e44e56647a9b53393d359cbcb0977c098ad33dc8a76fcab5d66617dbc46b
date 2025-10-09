"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const zod = require("zod");
const indexRouteSchema = zod.z.object({
  type: zod.z.literal("index"),
  file: zod.z.string()
});
const layoutRouteSchema = zod.z.object({
  type: zod.z.literal("layout"),
  id: zod.z.string().optional(),
  file: zod.z.string(),
  children: zod.z.array(zod.z.lazy(() => virtualRouteNodeSchema)).optional()
});
const routeSchema = zod.z.object({
  type: zod.z.literal("route"),
  file: zod.z.string().optional(),
  path: zod.z.string(),
  children: zod.z.array(zod.z.lazy(() => virtualRouteNodeSchema)).optional()
});
const physicalSubTreeSchema = zod.z.object({
  type: zod.z.literal("physical"),
  directory: zod.z.string(),
  pathPrefix: zod.z.string()
});
const virtualRouteNodeSchema = zod.z.union([
  indexRouteSchema,
  layoutRouteSchema,
  routeSchema,
  physicalSubTreeSchema
]);
const virtualRootRouteSchema = zod.z.object({
  type: zod.z.literal("root"),
  file: zod.z.string(),
  children: zod.z.array(virtualRouteNodeSchema).optional()
});
exports.virtualRootRouteSchema = virtualRootRouteSchema;
//# sourceMappingURL=config.cjs.map
