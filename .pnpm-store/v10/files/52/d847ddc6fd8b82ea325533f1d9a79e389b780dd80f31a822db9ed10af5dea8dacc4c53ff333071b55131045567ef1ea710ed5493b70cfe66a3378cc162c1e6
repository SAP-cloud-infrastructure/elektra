import { z } from "zod";
const indexRouteSchema = z.object({
  type: z.literal("index"),
  file: z.string()
});
const layoutRouteSchema = z.object({
  type: z.literal("layout"),
  id: z.string().optional(),
  file: z.string(),
  children: z.array(z.lazy(() => virtualRouteNodeSchema)).optional()
});
const routeSchema = z.object({
  type: z.literal("route"),
  file: z.string().optional(),
  path: z.string(),
  children: z.array(z.lazy(() => virtualRouteNodeSchema)).optional()
});
const physicalSubTreeSchema = z.object({
  type: z.literal("physical"),
  directory: z.string(),
  pathPrefix: z.string()
});
const virtualRouteNodeSchema = z.union([
  indexRouteSchema,
  layoutRouteSchema,
  routeSchema,
  physicalSubTreeSchema
]);
const virtualRootRouteSchema = z.object({
  type: z.literal("root"),
  file: z.string(),
  children: z.array(virtualRouteNodeSchema).optional()
});
export {
  virtualRootRouteSchema
};
//# sourceMappingURL=config.js.map
