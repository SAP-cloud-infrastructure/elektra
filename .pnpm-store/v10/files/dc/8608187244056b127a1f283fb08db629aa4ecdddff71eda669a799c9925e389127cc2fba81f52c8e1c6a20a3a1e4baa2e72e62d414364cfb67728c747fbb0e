import { z } from 'zod';
import { RegisteredRouter, RouteIds } from '@tanstack/router-core';
import { CodeSplitGroupings } from './constants.js';
export declare const splitGroupingsSchema: z.ZodEffects<z.ZodArray<z.ZodArray<z.ZodUnion<[z.ZodLiteral<"loader">, z.ZodLiteral<"component">, z.ZodLiteral<"pendingComponent">, z.ZodLiteral<"errorComponent">, z.ZodLiteral<"notFoundComponent">]>, "many">, "many">, ("loader" | "component" | "pendingComponent" | "errorComponent" | "notFoundComponent")[][], ("loader" | "component" | "pendingComponent" | "errorComponent" | "notFoundComponent")[][]>;
export type CodeSplittingOptions = {
    /**
     * Use this function to programmatically control the code splitting behavior
     * based on the `routeId` for each route.
     *
     * If you just need to change the default behavior, you can use the `defaultBehavior` option.
     * @param params
     */
    splitBehavior?: (params: {
        routeId: RouteIds<RegisteredRouter['routeTree']>;
    }) => CodeSplitGroupings | undefined | void;
    /**
     * The default/global configuration to control your code splitting behavior per route.
     * @default [['component'],['pendingComponent'],['errorComponent'],['notFoundComponent']]
     */
    defaultBehavior?: CodeSplitGroupings;
    /**
     * The nodes that shall be deleted from the route.
     * @default undefined
     */
    deleteNodes?: Array<DeletableNodes>;
    /**
     * @default true
     */
    addHmr?: boolean;
};
declare const DELETABLE_NODES: readonly ["ssr"];
export declare const deletableNodesSchema: z.ZodEnum<["ssr"]>;
export type DeletableNodes = (typeof DELETABLE_NODES)[number];
export declare const configSchema: z.ZodObject<{
    target: z.ZodDefault<z.ZodOptional<z.ZodEnum<["react", "solid"]>>>;
    virtualRouteConfig: z.ZodOptional<z.ZodUnion<[z.ZodType<import('@tanstack/virtual-file-routes').VirtualRootRoute, z.ZodTypeDef, import('@tanstack/virtual-file-routes').VirtualRootRoute>, z.ZodString]>>;
    routeFilePrefix: z.ZodOptional<z.ZodString>;
    routeFileIgnorePrefix: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    routeFileIgnorePattern: z.ZodOptional<z.ZodString>;
    routesDirectory: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    quoteStyle: z.ZodDefault<z.ZodOptional<z.ZodEnum<["single", "double"]>>>;
    semicolons: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    disableLogging: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    routeTreeFileHeader: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    indexToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    routeToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pathParamsAllowedCharacters: z.ZodOptional<z.ZodArray<z.ZodEnum<[";", ":", "@", "&", "=", "+", "$", ","]>, "many">>;
} & {
    generatedRouteTree: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    disableTypes: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    verboseFileRoutes: z.ZodOptional<z.ZodBoolean>;
    addExtensions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    enableRouteTreeFormatting: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    routeTreeFileFooter: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    autoCodeSplitting: z.ZodOptional<z.ZodBoolean>;
    customScaffolding: z.ZodOptional<z.ZodObject<{
        routeTemplate: z.ZodOptional<z.ZodString>;
        lazyRouteTemplate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        routeTemplate?: string | undefined;
        lazyRouteTemplate?: string | undefined;
    }, {
        routeTemplate?: string | undefined;
        lazyRouteTemplate?: string | undefined;
    }>>;
    experimental: z.ZodOptional<z.ZodObject<{
        enableCodeSplitting: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enableCodeSplitting?: boolean | undefined;
    }, {
        enableCodeSplitting?: boolean | undefined;
    }>>;
    plugins: z.ZodOptional<z.ZodArray<z.ZodType<import('@tanstack/router-generator').GeneratorPlugin, z.ZodTypeDef, import('@tanstack/router-generator').GeneratorPlugin>, "many">>;
    tmpDir: z.ZodDefault<z.ZodOptional<z.ZodString>>;
} & {
    enableRouteGeneration: z.ZodOptional<z.ZodBoolean>;
    codeSplittingOptions: z.ZodOptional<z.ZodType<CodeSplittingOptions, z.ZodTypeDef, CodeSplittingOptions>>;
    plugin: z.ZodOptional<z.ZodObject<{
        vite: z.ZodOptional<z.ZodObject<{
            environmentName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            environmentName?: string | undefined;
        }, {
            environmentName?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        vite?: {
            environmentName?: string | undefined;
        } | undefined;
    }, {
        vite?: {
            environmentName?: string | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    target: "react" | "solid";
    routeFileIgnorePrefix: string;
    routesDirectory: string;
    quoteStyle: "single" | "double";
    semicolons: boolean;
    disableLogging: boolean;
    routeTreeFileHeader: string[];
    indexToken: string;
    routeToken: string;
    generatedRouteTree: string;
    disableTypes: boolean;
    addExtensions: boolean;
    enableRouteTreeFormatting: boolean;
    routeTreeFileFooter: string[];
    tmpDir: string;
    enableRouteGeneration?: boolean | undefined;
    codeSplittingOptions?: CodeSplittingOptions | undefined;
    plugin?: {
        vite?: {
            environmentName?: string | undefined;
        } | undefined;
    } | undefined;
    virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
    routeFilePrefix?: string | undefined;
    routeFileIgnorePattern?: string | undefined;
    pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
    verboseFileRoutes?: boolean | undefined;
    autoCodeSplitting?: boolean | undefined;
    customScaffolding?: {
        routeTemplate?: string | undefined;
        lazyRouteTemplate?: string | undefined;
    } | undefined;
    experimental?: {
        enableCodeSplitting?: boolean | undefined;
    } | undefined;
    plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
}, {
    enableRouteGeneration?: boolean | undefined;
    codeSplittingOptions?: CodeSplittingOptions | undefined;
    plugin?: {
        vite?: {
            environmentName?: string | undefined;
        } | undefined;
    } | undefined;
    target?: "react" | "solid" | undefined;
    virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
    routeFilePrefix?: string | undefined;
    routeFileIgnorePrefix?: string | undefined;
    routeFileIgnorePattern?: string | undefined;
    routesDirectory?: string | undefined;
    quoteStyle?: "single" | "double" | undefined;
    semicolons?: boolean | undefined;
    disableLogging?: boolean | undefined;
    routeTreeFileHeader?: string[] | undefined;
    indexToken?: string | undefined;
    routeToken?: string | undefined;
    pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
    generatedRouteTree?: string | undefined;
    disableTypes?: boolean | undefined;
    verboseFileRoutes?: boolean | undefined;
    addExtensions?: boolean | undefined;
    enableRouteTreeFormatting?: boolean | undefined;
    routeTreeFileFooter?: string[] | undefined;
    autoCodeSplitting?: boolean | undefined;
    customScaffolding?: {
        routeTemplate?: string | undefined;
        lazyRouteTemplate?: string | undefined;
    } | undefined;
    experimental?: {
        enableCodeSplitting?: boolean | undefined;
    } | undefined;
    plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
    tmpDir?: string | undefined;
}>;
export declare const getConfig: (inlineConfig: Partial<Config>, root: string) => {
    target: "react" | "solid";
    routeFileIgnorePrefix: string;
    routesDirectory: string;
    quoteStyle: "single" | "double";
    semicolons: boolean;
    disableLogging: boolean;
    routeTreeFileHeader: string[];
    indexToken: string;
    routeToken: string;
    generatedRouteTree: string;
    disableTypes: boolean;
    addExtensions: boolean;
    enableRouteTreeFormatting: boolean;
    routeTreeFileFooter: string[];
    tmpDir: string;
    enableRouteGeneration?: boolean | undefined;
    codeSplittingOptions?: CodeSplittingOptions | undefined;
    plugin?: {
        vite?: {
            environmentName?: string | undefined;
        } | undefined;
    } | undefined;
    virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
    routeFilePrefix?: string | undefined;
    routeFileIgnorePattern?: string | undefined;
    pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
    verboseFileRoutes?: boolean | undefined;
    autoCodeSplitting?: boolean | undefined;
    customScaffolding?: {
        routeTemplate?: string | undefined;
        lazyRouteTemplate?: string | undefined;
    } | undefined;
    experimental?: {
        enableCodeSplitting?: boolean | undefined;
    } | undefined;
    plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
};
export type Config = z.infer<typeof configSchema>;
export type ConfigInput = z.input<typeof configSchema>;
export type ConfigOutput = z.output<typeof configSchema>;
export {};
