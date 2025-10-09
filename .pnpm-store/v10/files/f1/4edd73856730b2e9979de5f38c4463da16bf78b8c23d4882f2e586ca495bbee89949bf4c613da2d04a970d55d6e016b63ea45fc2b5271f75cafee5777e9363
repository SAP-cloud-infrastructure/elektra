import { Config } from './config.js';
import { ImportDeclaration, RouteNode } from './types.js';
export declare function multiSortBy<T>(arr: Array<T>, accessors?: Array<(item: T) => any>): Array<T>;
export declare function cleanPath(path: string): string;
export declare function trimPathLeft(path: string): string;
export declare function removeLeadingSlash(path: string): string;
export declare function removeTrailingSlash(s: string): string;
export declare function determineInitialRoutePath(routePath: string): string;
export declare function replaceBackslash(s: string): string;
export declare function routePathToVariable(routePath: string): string;
export declare function removeUnderscores(s?: string): string | undefined;
export declare function capitalize(s: string): string;
export declare function removeExt(d: string, keepExtension?: boolean): string;
/**
 * This function writes to a file if the content is different.
 *
 * @param filepath The path to the file
 * @param content Original content
 * @param incomingContent New content
 * @param callbacks Callbacks to run before and after writing
 * @returns Whether the file was written
 */
export declare function writeIfDifferent(filepath: string, content: string, incomingContent: string, callbacks?: {
    beforeWrite?: () => void;
    afterWrite?: () => void;
}): Promise<boolean>;
/**
 * This function formats the source code using the default formatter (Prettier).
 *
 * @param source The content to format
 * @param config The configuration object
 * @returns The formatted content
 */
export declare function format(source: string, config: {
    quoteStyle: 'single' | 'double';
    semicolons: boolean;
}): Promise<string>;
/**
 * This function resets the regex index to 0 so that it can be reused
 * without having to create a new regex object or worry about the last
 * state when using the global flag.
 *
 * @param regex The regex object to reset
 * @returns
 */
export declare function resetRegex(regex: RegExp): void;
/**
 * This function checks if a file exists.
 *
 * @param file The path to the file
 * @returns Whether the file exists
 */
export declare function checkFileExists(file: string): Promise<boolean>;
export declare function removeGroups(s: string): string;
/**
 * Removes all segments from a given path that start with an underscore ('_').
 *
 * @param {string} routePath - The path from which to remove segments. Defaults to '/'.
 * @returns {string} The path with all underscore-prefixed segments removed.
 * @example
 * removeLayoutSegments('/workspace/_auth/foo') // '/workspace/foo'
 */
export declare function removeLayoutSegments(routePath?: string): string;
/**
 * The `node.path` is used as the `id` in the route definition.
 * This function checks if the given node has a parent and if so, it determines the correct path for the given node.
 * @param node - The node to determine the path for.
 * @returns The correct path for the given node.
 */
export declare function determineNodePath(node: RouteNode): string | undefined;
/**
 * Removes the last segment from a given path. Segments are considered to be separated by a '/'.
 *
 * @param {string} routePath - The path from which to remove the last segment. Defaults to '/'.
 * @returns {string} The path with the last segment removed.
 * @example
 * removeLastSegmentFromPath('/workspace/_auth/foo') // '/workspace/_auth'
 */
export declare function removeLastSegmentFromPath(routePath?: string): string;
export declare function hasParentRoute(routes: Array<RouteNode>, node: RouteNode, routePathToCheck: string | undefined): RouteNode | null;
/**
 * Gets the final variable name for a route
 */
export declare const getResolvedRouteNodeVariableName: (routeNode: RouteNode, variableNameSuffix: string) => string;
/**
 * Checks if a given RouteNode is valid for augmenting it with typing based on conditions.
 * Also asserts that the RouteNode is defined.
 *
 * @param routeNode - The RouteNode to check.
 * @returns A boolean indicating whether the RouteNode is defined.
 */
export declare function isRouteNodeValidForAugmentation(routeNode?: RouteNode): routeNode is RouteNode;
/**
 * Infers the path for use by TS
 */
export declare const inferPath: (routeNode: RouteNode) => string;
/**
 * Infers the full path for use by TS
 */
export declare const inferFullPath: (routeNode: RouteNode) => string;
/**
 * Creates a map from fullPath to routeNode
 */
export declare const createRouteNodesByFullPath: (routeNodes: Array<RouteNode>) => Map<string, RouteNode>;
/**
 * Create a map from 'to' to a routeNode
 */
export declare const createRouteNodesByTo: (routeNodes: Array<RouteNode>) => Map<string, RouteNode>;
/**
 * Create a map from 'id' to a routeNode
 */
export declare const createRouteNodesById: (routeNodes: Array<RouteNode>) => Map<string, RouteNode>;
/**
 * Infers to path
 */
export declare const inferTo: (routeNode: RouteNode) => string;
/**
 * Dedupes branches and index routes
 */
export declare const dedupeBranchesAndIndexRoutes: (routes: Array<RouteNode>) => Array<RouteNode>;
export declare function checkRouteFullPathUniqueness(_routes: Array<RouteNode>, config: Config): void;
export declare function buildRouteTreeConfig(nodes: Array<RouteNode>, exportName: string, disableTypes: boolean, depth?: number): Array<string>;
export declare function buildImportString(importDeclaration: ImportDeclaration): string;
export declare function lowerCaseFirstChar(value: string): string;
export declare function mergeImportDeclarations(imports: Array<ImportDeclaration>): Array<ImportDeclaration>;
export declare function hasChildWithExport(node: RouteNode, exportName: string): boolean;
export declare const findParent: (node: RouteNode | undefined, exportName: string) => string;
export declare function buildFileRoutesByPathInterface(opts: {
    routeNodes: Array<RouteNode>;
    module: string;
    interfaceName: string;
    exportName: string;
}): string;
