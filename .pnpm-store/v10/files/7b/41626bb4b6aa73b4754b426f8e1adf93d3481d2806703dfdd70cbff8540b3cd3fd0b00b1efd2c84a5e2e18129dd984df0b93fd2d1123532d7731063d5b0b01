import { format } from "./utils.js";
function fillTemplate(config, template, values) {
  const replaced = template.replace(
    /%%(\w+)%%/g,
    (_, key) => values[key] || ""
  );
  return format(replaced, config);
}
function getTargetTemplate(config) {
  const target = config.target;
  switch (target) {
    case "react":
      return {
        fullPkg: "@tanstack/react-router",
        subPkg: "react-router",
        rootRoute: {
          template: () => [
            'import * as React from "react"\n',
            "%%tsrImports%%",
            "\n\n",
            "%%tsrExportStart%%{\n component: RootComponent\n }%%tsrExportEnd%%\n\n",
            'function RootComponent() { return (<React.Fragment><div>Hello "%%tsrPath%%"!</div><Outlet /></React.Fragment>) };\n'
          ].join(""),
          imports: {
            tsrImports: () => "import { Outlet, createRootRoute } from '@tanstack/react-router';",
            tsrExportStart: () => "export const Route = createRootRoute(",
            tsrExportEnd: () => ");"
          }
        },
        route: {
          template: () => [
            "%%tsrImports%%",
            "\n\n",
            "%%tsrExportStart%%{\n component: RouteComponent\n }%%tsrExportEnd%%\n\n",
            'function RouteComponent() { return <div>Hello "%%tsrPath%%"!</div> };\n'
          ].join(""),
          imports: {
            tsrImports: () => config.verboseFileRoutes === false ? "" : "import { createFileRoute } from '@tanstack/react-router';",
            tsrExportStart: (routePath) => config.verboseFileRoutes === false ? "export const Route = createFileRoute(" : `export const Route = createFileRoute('${routePath}')(`,
            tsrExportEnd: () => ");"
          }
        },
        lazyRoute: {
          template: () => [
            "%%tsrImports%%",
            "\n\n",
            "%%tsrExportStart%%{\n component: RouteComponent\n }%%tsrExportEnd%%\n\n",
            'function RouteComponent() { return <div>Hello "%%tsrPath%%"!</div> };\n'
          ].join(""),
          imports: {
            tsrImports: () => config.verboseFileRoutes === false ? "" : "import { createLazyFileRoute } from '@tanstack/react-router';",
            tsrExportStart: (routePath) => config.verboseFileRoutes === false ? "export const Route = createLazyFileRoute(" : `export const Route = createLazyFileRoute('${routePath}')(`,
            tsrExportEnd: () => ");"
          }
        }
      };
    case "solid":
      return {
        fullPkg: "@tanstack/solid-router",
        subPkg: "solid-router",
        rootRoute: {
          template: () => [
            'import * as Solid from "solid-js"\n',
            "%%tsrImports%%",
            "\n\n",
            "%%tsrExportStart%%{\n component: RootComponent\n }%%tsrExportEnd%%\n\n",
            'function RootComponent() { return (<><div>Hello "%%tsrPath%%"!</div><Outlet /></>) };\n'
          ].join(""),
          imports: {
            tsrImports: () => "import { Outlet, createRootRoute } from '@tanstack/solid-router';",
            tsrExportStart: () => "export const Route = createRootRoute(",
            tsrExportEnd: () => ");"
          }
        },
        route: {
          template: () => [
            "%%tsrImports%%",
            "\n\n",
            "%%tsrExportStart%%{\n component: RouteComponent\n }%%tsrExportEnd%%\n\n",
            'function RouteComponent() { return <div>Hello "%%tsrPath%%"!</div> };\n'
          ].join(""),
          imports: {
            tsrImports: () => config.verboseFileRoutes === false ? "" : "import { createFileRoute } from '@tanstack/solid-router';",
            tsrExportStart: (routePath) => config.verboseFileRoutes === false ? "export const Route = createFileRoute(" : `export const Route = createFileRoute('${routePath}')(`,
            tsrExportEnd: () => ");"
          }
        },
        lazyRoute: {
          template: () => [
            "%%tsrImports%%",
            "\n\n",
            "%%tsrExportStart%%{\n component: RouteComponent\n }%%tsrExportEnd%%\n\n",
            'function RouteComponent() { return <div>Hello "%%tsrPath%%"!</div> };\n'
          ].join(""),
          imports: {
            tsrImports: () => config.verboseFileRoutes === false ? "" : "import { createLazyFileRoute } from '@tanstack/solid-router';",
            tsrExportStart: (routePath) => config.verboseFileRoutes === false ? "export const Route = createLazyFileRoute(" : `export const Route = createLazyFileRoute('${routePath}')(`,
            tsrExportEnd: () => ");"
          }
        }
      };
    default:
      throw new Error(`router-generator: Unknown target type: ${target}`);
  }
}
export {
  fillTemplate,
  getTargetTemplate
};
//# sourceMappingURL=template.js.map
